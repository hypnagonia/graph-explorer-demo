<script>
  import { getContext, createEventDispatcher } from "svelte";
  import { onDestroy } from "svelte";
  import * as PIXI from "pixi.js";
  import { keyBy, isEmpty, forEach } from "lodash-es";
  import { scaleLinear, extent } from "d3";

  export let nodes = [];
  export let edges = [];
  export let width;
  export let height;

  const app = getContext("pixiApp");
  const dispatch = createEventDispatcher();
  const angleAdjustment = Math.PI / 12;

  let stage;
  let renderer;

  let nodes_container = new PIXI.Container(), // Nodes container
    nodesbg_container = new PIXI.Container(), // Nodes bg container
    nodes_selected_container = new PIXI.Container(), // Nodes selected container
    edges_container = new PIXI.Container(), // Edges container
    labels_container = new PIXI.Container(); // Node labels container

  let nodeStrokeScale = scaleLinear();

  $: nodesById = keyBy(nodes, "id");
  $: edgesById = keyBy(edges, "id");

  $: {
    if ($app) {
      stage = $app.stage;
      renderer = $app.renderer;
      renderer.resize(width, height);

      let nodesInitial = false;
      let edgesInitial = false;

      ///////////////////
      // N O D E S
      //
      // init
      if (nodes_container.children.length === 0) {
        const nodeSizeDomain = extent(nodes, (node) => node.size);
        const nodeStrokeMin = Math.min(nodeSizeDomain[0] / 5, 0.5);
        const nodeStrokeMax = Math.min(nodeSizeDomain[1] / 20, 2);
        nodeStrokeScale
          .domain(nodeSizeDomain)
          .range([nodeStrokeMin, nodeStrokeMax]);

        nodes.forEach((node, i) => {
          let node_gfx = new PIXI.Graphics();

          node_gfx.beginFill(node.color);
          node_gfx.lineStyle(
            nodeStrokeScale(node.size) * node.seed ? 4 : 0.5,
            node.borderColor,
            0.5,
          );

          // console.log({node})
          node_gfx.drawCircle(0, 0, node.size);
          node_gfx.endFill();

          node_gfx.position.set(node.x, node.y);
          node_gfx.cursor = "pointer";
          node_gfx.eventMode = "static";
          node_gfx.alpha = 0;
          node_gfx
            .on("mouseover", () => {
              dispatch("node-mouseover", node.id);
            }) // Display tooltip when mouseover node
            .on("mouseout", () => {
              dispatch("node-mouseout", node.id);
            }) // No display tooltip
            .on("click", () => {
              dispatch("node-click", node.id);
            }); // Handle click/dbclick event
          node_gfx.id = node.id;
          nodes_container.addChild(node_gfx);

          let node_bg = new PIXI.Graphics();
          node_bg.beginFill("rgba(255,255,255,0.2)");
          node_bg.drawCircle(node.x, node.y, node.size * 1.15);
          node_bg.endFill();
          node_bg.id = node.id;
          nodesbg_container.addChild(node_bg);
        });

        nodesInitial = true;
      }

      forEach(nodes_selected_container.children, (node_border) => {
        nodes_selected_container.removeChild(node_border);
      });

      // update
      if (!isEmpty(nodesById) && nodes_container.children.length > 0) {
        forEach(nodes_container.children, (node_gfx) => {
          const node = nodesById[node_gfx.id];
          if (node.hidden) {
            node_gfx.alpha = 0;
            node_gfx.eventMode = "none";
          } else if (node.marked) {
            node_gfx.alpha = 0.1;
            node_gfx.tint = 0xaaaaaa;
            node_gfx.eventMode = "none";
          } else {
            node_gfx.alpha = 1;
            node_gfx.tint = 0xffffff;
            node_gfx.eventMode = "static";
          }

          // selected node
          if (node.selected) {
            return;
            let node_border = new PIXI.Graphics();
            node_border.lineStyle(1, "#fff", 0.5);
            node_border.beginFill("transparent");
            node_border.drawCircle(
              node.x,
              node.y,
              Math.max(node.size * 1.5, node.size + 2),
            );
            node_border.endFill();
            node_border.id = node.id;
            node_border.eventMode = "none";
            nodes_selected_container.addChild(node_border);
          }
        });
      }

      if (!isEmpty(nodesById) && nodesbg_container.children.length > 0) {
        forEach(nodesbg_container.children, (node_bg) => {
          const node = nodesById[node_bg.id];
          if (node.hidden) {
            node_bg.tint = 0x000000;
            node_bg.alpha = 0;
          } else {
            node_bg.tint = 0x000000;
            node_bg.alpha = 1;
          }
        });
      }

      ///////////////////
      // E D G E S
      //

      // init
      if (edges_container.children.length === 0) {
        edges.forEach((edge) => {
          let edge_gfx = new PIXI.Graphics();
          const color = edge.color;
          console.log(
            edge.bidirectional,
            !edge.source.hidden,
            !edge.target.hidden,
          );
          edge_gfx.lineStyle(edge.size, color, edge.opacity);

          /*
          console.log(edge.bidirectional, edge.source.hidden, edge.target.hidden)
          if (edge.bidirectional === "Tf" || edge.bidirectional === "Ft" && !edge.source.hidden && !edge.target.hidden) {
            edge_gfx.moveTo(edge.source.x, edge.source.y);
            edge_gfx.lineTo(
              (edge.source.x + edge.target.x) / 2,
              (edge.source.y + edge.target.y) / 2,
            );
          } else if (edge.bidirectional  && !edge.source.hidden && !edge.target.hidden) {
            edge_gfx.moveTo(
              (edge.source.x + edge.target.x) / 2,
              (edge.source.y + edge.target.y) / 2,
            );
            edge_gfx.lineTo(edge.target.x, edge.target.y);
          } else {*/
          edge_gfx.moveTo(edge.source.x, edge.source.y);
          edge_gfx.lineTo(edge.target.x, edge.target.y);

          edge_gfx.id = edge.id;
          edge_gfx.alpha = 0;
          edges_container.addChild(edge_gfx);

          let angle = Math.atan2(
            edge.target.y - edge.source.y,
            edge.target.x - edge.source.x,
          );
          let arrowLength = 50;

          let targetX = edge.target.x - edge.target.size * Math.cos(angle);
          let targetY = edge.target.y - edge.target.size * Math.sin(angle);

          drawArrowhead(
            edges_container,
            edge.id,
            targetX,
            targetY,
            angle + Math.PI,
            arrowLength,
            color,
            edge.opacity,
          );

          function drawArrowhead(
            edges_container,
            id,
            x,
            y,
            angle,
            length,
            color,
            opacity,
          ) {
            let arrow = new PIXI.Graphics();
            arrow.id = id;
            arrow.lineStyle(edge.size * 1.5, color, opacity);
            arrow.moveTo(x, y);
            arrow.lineTo(
              x + length * Math.cos(angle - angleAdjustment),
              y + length * Math.sin(angle - angleAdjustment),
            );
            arrow.moveTo(x, y);
            arrow.lineTo(
              x + length * Math.cos(angle + angleAdjustment),
              y + length * Math.sin(angle + angleAdjustment),
            );
            edges_container.addChild(arrow);
          }
        });

        edgesInitial = true;
      }

      // update
      if (!isEmpty(edgesById) && edges_container.children.length > 0) {
        forEach(edges_container.children, (edge_gfx) => {
          const edge = edgesById[edge_gfx.id];

          if (edge.hidden) {
            edge_gfx.alpha = 0;
            edge_gfx.tint = 0xffffff;
          } else if (edge.marked) {
            edge_gfx.alpha = 0.1;
            edge_gfx.tint = 0xaaaaaa;
          } else {
            edge_gfx.alpha = 1;
            edge_gfx.tint = 0xffffff;
          }
        });
      }

      if (nodesInitial && edgesInitial) {
        stage.addChild(
          edges_container,
          nodesbg_container,
          nodes_selected_container,
          nodes_container,
        );
      }

      let scale =
        Math.min(
          width / nodes_container.width,
          height / nodes_container.height,
        ) - 0.5; // magical number

      stage.scale.set(scale, scale);
      stage.x = (width - nodes_container.width * scale) / 2;
      stage.y = (height - nodes_container.height * scale) / 2;

      $app.render();
    }
  }

  onDestroy(() => {
    try {
      if ($app) {
        $app.stage.removeChild(nodes_container);
        $app.stage.removeChild(nodesbg_container);
        $app.stage.removeChild(nodes_selected_container);
        $app.stage.removeChild(edges_container);
        $app.stage.removeChild(labels_container);
      }
    } catch (e) {
      console.log("error", e);
    }
    nodes_container = undefined;
    edges_container = undefined;
    labels_container = undefined;
    if ($app) {
      $app.render();
    }
  });
</script>
