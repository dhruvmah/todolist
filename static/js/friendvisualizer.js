
$(document).ready(function() {
  $.getJSON('/friendvisualization', function (json) {
      console.log(json)
      var infovis = document.getElementById('infovis');
      var w = infovis.offsetWidth - 50, h = infovis.offsetHeight - 50;
      
      //init Hypertree
      var ht = new $jit.Hypertree({
        //id of the visualization container
        injectInto: 'infovis',
        //canvas width and height
        width: w,
        height: h,
        //Change node and edge styles such as
        //color, width and dimensions.
        Node: {
            dim: 9,
            color: "#f00"
        },
        Edge: {
            lineWidth: 2,
            color: "#088"
        },
        onBeforeCompute: function(node){
            // Log.write("centering");
        },
        //Attach event handlers and add text to the
        //labels. This method is only triggered on label
        //creation
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            $jit.util.addEvent(domElement, 'click', function () {
                ht.onClick(node.id, {
                    onComplete: function() {
                        ht.controller.onComplete();
                    }
                });
            });
        },
        //Change node styles when labels are placed
        //or moved.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';
            if (node._depth <= 1) {
                style.fontSize = "0.8em";
                style.color = "#ddd";

            } else if(node._depth == 2){
                style.fontSize = "0.7em";
                style.color = "#555";

            } else {
                style.display = 'none';
            }

            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        },
        
        onComplete: function(){
        }
      });
      //load JSON data.
      ht.loadJSON(json);
      //compute positions and plot.
      ht.refresh();
      //end
      ht.controller.onComplete();
    });
});
