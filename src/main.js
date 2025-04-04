let field;
let plots = [];
const factor = 100;
const svg = document.querySelector("svg");

let selection;
let tool;
// 1: Add Plot, 2: Poly Plot, 3: Delete

const beginButton = document.getElementById("begin");
beginButton.addEventListener("click", pressBegin);

function pressBegin () {
  let x = document.getElementById("x");
  let y = document.getElementById("y");
  let startpanel = document.getElementById("start-panel")
  
  if (!isNaN(parseInt(x.value)) && !isNaN(parseInt(y.value))) {
    // field = new Grid(x.value, y.value);
    field = {
      width: x.value,
      length: y.value
    }
    startpanel.style.animation = "1s ease-in forwards slideRight";
    
    init();
  }
}

const load = document.querySelector("#load");
load.addEventListener("change", pressLoad);

function pressLoad ({target}) {
  try {
    // Read file
    const reader = new FileReader();
    reader.onload = () => {
      // Data
      const data = JSON.parse(reader.result)
      
      field = {
        width: data.dimensions[0],
        length: data.dimensions[1]
      }
      
      
      
      let startpanel = document.getElementById("start-panel")
      startpanel.style.animation = "1s ease-in forwards slideRight";

      init();
      loadField(reader.result)
    }
    
    reader.readAsText(target.files[0]);
    
    
  }
  catch {
    alert("Upload error. Try again.");
  }
}

// Toolbar
let toolbar = document.querySelector("#toolbar");
toolbar.addEventListener("click", ({target}) => {
  tool = null;
  document.querySelector("#plot").classList.remove("selected");
  document.querySelector("#building").classList.remove("selected");
  document.querySelector("#delete").classList.remove("selected");
  
  if (target.id != "toolbar" && target.id != "print" && target.id != "save") {
    target.classList.add("selected");
  }
  
  switch (target.id) {
    case "plot":
      tool = 1;
      break;
    case "building":
      tool = 2;
      break;
    case "delete":
      tool = 3;
      break;
    default:
      break
  }
});
document.querySelector("#save").onclick = save;





function init () {
  // Enable toolbar
  document.querySelector("#toolbar").style.display = "block";
  
  // Draw field
  svg.setAttribute("x", 0)
  svg.setAttribute("y", 0)
  
  // Initial zoom
  let longerMeasurement = Math.max(field.width, field.length);
  let scaleFactor = (Math.min(window.innerWidth, window.innerHeight) * 0.8)/longerMeasurement;
  svg.setAttribute("width", field.width * scaleFactor)
  svg.setAttribute("height", field.length * scaleFactor)
  
  svg.setAttribute("viewBox", "0 0 " + field.width * factor + " " + field.length * factor)
  
  svg.style.display = "block";
  
  function scl (number) {
    let width = svg.getAttribute("width");
    let vbox = svg.getAttribute("viewBox").split(" ");
    let vwidth = parseInt(vbox[2]);
          
    return Math.round((number * (vwidth / width)) / factor) * factor;
  } 
  
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", 0);
  background.setAttribute("y", 0);
  background.setAttribute("width", field.width * factor);
  background.setAttribute("height", field.length * factor);
  background.style.zIndex = -10;
  background.setAttribute("fill", "url(#Grid)");
  
  svg.appendChild(background)
  
  //Listen for keypress to edit
  document.querySelector("#edit-panel").addEventListener("click", edit);
  document.querySelector("#edit-panel").addEventListener("keyup", edit);
  
  //Listen for click to select
  addEventListener("click", select);
  
  // Listen for scroll to zoom
  addEventListener("wheel", ({deltaY}) => {
    deltaY = Math.sign(deltaY) * -2
    svg.setAttribute("width", svg.getAttribute("width") * (1 + 0.02 * deltaY))
    svg.setAttribute("height", svg.getAttribute("height") * (1 + 0.02 * deltaY))
  })
  
  // Listen to mouse events for plot creation
  background.addEventListener("mousedown", (event) => {
    if (tool == 1 || tool == 2) beginNewPlot(event);
  });
  
  // Bizarre, probably disgusting, not very performant approach
  function beginNewPlot ({offsetX, offsetY}) {
    
    let startX = scl(offsetX);
    let startY = scl(offsetY);
    
    let posX = scl(offsetX);
    let posY = scl(offsetY);
    
    

    // Listen for mousemove to size the plot
    svg.addEventListener("mousemove", sizePlot);
    
    const newPlot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    newPlot.setAttribute("x", posX);
    newPlot.setAttribute("y", posY);
    newPlot.setAttribute("width", factor);
    newPlot.setAttribute("height", factor);
    newPlot.style.fill = "blue";
    newPlot.style.opacity = "50%";
    
    svg.appendChild(newPlot)
    


    function sizePlot ({movementX, movementY, offsetX, offsetY}) {
      let endX = scl(offsetX);
      let endY = scl(offsetY);
      
      // Better
      newPlot.setAttribute("x", Math.min(startX, endX));
      newPlot.setAttribute("y", Math.min(startY, endY));
      
      let sizeX = Math.max(Math.abs(endX - startX), factor);
      let sizeY = Math.max(Math.abs(endY - startY), factor);
      
      newPlot.setAttribute("width", sizeX);
      newPlot.setAttribute("height", sizeY);
    }
    // Listen for mouseup to complete the plot
    addEventListener("mouseup", completePlot);

    function completePlot () {
      svg.removeEventListener("mousemove", sizePlot);
      removeEventListener("mouseup", completePlot);
      
      newPlot.style.fill = "#201002";
      newPlot.style.opacity = "100%";
      
      if (tool == 2) newPlot.style.fill = "#aa0000";
      
      
      let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      
      label.setAttribute("x", parseInt(newPlot.getAttribute("x")) + parseInt(newPlot.getAttribute("width") / 2));
      label.setAttribute("y", parseInt(newPlot.getAttribute("y")) + parseInt(newPlot.getAttribute("height") / 2));
      label.setAttribute("lengthAdjust", "spacingAndGlyphs");
      // label.setAttribute("textLength", 10);
      label.style.fill = "#ffffff";
      label.style.stroke = "#000000";
      label.style.strokeWidth = "2px";
      label.style.font = "bold 30px sans-serif";
      label.setAttribute("text-anchor", "middle")
      label.zIndex = 10;
      svg.appendChild(label);
      
      let defaultName = "Plot ";
      if (tool == 2) defaultName = "Building "
      let plot = {
        x: newPlot.getAttribute("x"),
        y: newPlot.getAttribute("y"),
        width: Math.abs(newPlot.getAttribute("width")),
        height: Math.abs(newPlot.getAttribute("height")),
        svg: newPlot,
        name: defaultName + (plots.length + 1),
        label: label,
        fence: false,
        type: tool,
        cost: 0.15,
        seeds: 4
      }
      plots.push(plot);
      
      
      label.textContent = plot.name;
      //label.setAttribute("textLength", plot.width);
      
      // Select newest plot
      select({target: plot.svg})
      
      // Deselect tool
      tool = null;
      document.querySelector("#plot").classList.remove("selected");
      document.querySelector("#building").classList.remove("selected");
      
      // Listen for deletion
      newPlot.addEventListener("click", (event) => {
        if (tool == 3) del(event);
      })
    }
  }
  
  const printButton = document.querySelector("#print");
  printButton.addEventListener("click", () => {
    window.print();
  });
  
  // Panning
  let panX = 0;
  let panY = 0;
  document.addEventListener("keydown", ({key}) => {
    if (key == "ArrowUp") panY += 10;
    if (key == "ArrowDown") panY -= 10;
    if (key == "ArrowLeft") panX += 10;
    if (key == "ArrowRight") panX -= 10;
    if (key == " ") {
      panX = 0;
      panY = 0;
    }

    svg.style.left = `calc(50% + ${panX}px)`
    svg.style.top = `calc(50% + ${panY}px)`
  })
  
  // Cost calculation
  document.querySelector("#calculate").onclick = calculateCost;
}

function edit () {
  // Set edit thing
  let name = document.querySelector("#edit-panel #name");
  let x = document.querySelector("#edit-panel #editX");
  let y = document.querySelector("#edit-panel #editY");
  let w = document.querySelector("#edit-panel #editWidth");
  let h = document.querySelector("#edit-panel #editHeight");
  let fence = document.querySelector("#edit-panel #fence");
  let seeds = document.querySelector("#edit-panel #seeds");
  let costInput = document.querySelector("#edit-panel #cost");
  
  selection.name = name.value;
  selection.x = x.value * factor;
  selection.y = y.value * factor;
  selection.width = w.value * factor;
  selection.height = h.value * factor;
  selection.fence = fence.checked;
  selection.seeds = seeds.value;
  selection.cost = costInput.value;
  
  let rect = selection.svg;
  rect.setAttribute("x", selection.x);
  rect.setAttribute("y", selection.y);
  rect.setAttribute("width", selection.width);
  rect.setAttribute("height", selection.height);
  if (fence.checked) {
    rect.style.stroke = "#ddccbb";
    rect.style.strokeWidth = 5;
    rect.style.strokeDasharray = "50,10";
    // rect.setAttribute("stroke-dasharray", "10,10")
  }
  else {
    rect.style.strokeWidth = 0;
  }
  
  // Label
  let label = selection.label;
  label.setAttribute("x", parseInt(rect.getAttribute("x")) + parseInt(rect.getAttribute("width") / 2));
  label.setAttribute("y", parseInt(rect.getAttribute("y")) + parseInt(rect.getAttribute("height") / 2));
  label.textContent = selection.name;
  
  // Seed count
  let seedTotal = parseInt(seeds.value) * Number(w.value) * Number(h.value);
  document.querySelector("#seedsDisplay").textContent = "Total Seeds: " + seedTotal;
  
  // let value = Number(w.value)
  // * Number(h.value)
  // * Number(costInput.value);
  // document.querySelector("#costDisplay").textContent = "$" + (value)
}

function calculateCost () {
  let w = document.querySelector("#edit-panel #editWidth");
  let h = document.querySelector("#edit-panel #editHeight");
  let costInput = document.querySelector("#edit-panel #cost");
  
  let value = parseInt(w.value)
  * parseInt(h.value)
  * Number(costInput.value);
  value *= 100;
  value = Math.round(value);
  value /= 100;
  document.querySelector("#costDisplay").textContent = "$" + (value)
}

function del ({target}) {
  let plot = getPlot(target);
  
  plots.splice(plots.indexOf(plot), 1);
  svg.removeChild(target);
  svg.removeChild(plot.label)
  plot = undefined;
  
  // Deselect tool
  tool = null;
  document.querySelector("#delete").classList.remove("selected");
}

function getPlot (svg) {
  for (let i = 0; i < plots.length; i++) {
    if (plots[i].svg == svg) return plots[i]
  }
}

function select ({target}) {
  if (target instanceof SVGRectElement) {
    // Deselect old selection
    if (selection) selection.svg.style.outline = "none";
    
    selection = getPlot(target) || selection;
    selection.svg.style.outline = "2px solid white";
    
    // Set edit thing
    let editPanel = document.querySelector("#edit-panel");
    editPanel.style.display = "block";
    
    let name = document.querySelector("#edit-panel #name");
    let x = document.querySelector("#edit-panel #editX");
    let y = document.querySelector("#edit-panel #editY");
    let w = document.querySelector("#edit-panel #editWidth");
    let h = document.querySelector("#edit-panel #editHeight");
    let fence = document.querySelector("#edit-panel #fence");
    let seeds = document.querySelector("#edit-panel #seeds");
    let costInput = document.querySelector("#edit-panel #cost");

    name.value = selection.name;
    x.value = selection.x / factor;
    y.value = selection.y / factor;
    w.value = selection.width / factor;
    h.value = selection.height / factor;
    fence.checked = selection.fence;
    seeds.value = selection.seeds;
    costInput.value = selection.cost;
    
    document.querySelector("#costDisplay").textContent = "";
    
    // Seed count
    let seedTotal = parseInt(seeds.value) * Number(w.value) * Number(h.value);
    document.querySelector("#seedsDisplay").textContent = "Total Seeds: " + seedTotal;
  
    
  }
  else if (target == document.body) {
    // Deselect old selection
    if (selection) selection.svg.style.outline = "none";
    
    selection = null;
    
    let editPanel = document.querySelector("#edit-panel");
    editPanel.style.display = "none";
    
    
  }
  
  
  
}

function save () {
  const data = {
    dimensions: [field.width, field.length],
    plots: plots
  }
  const json = JSON.stringify(data);
  
  const file = new File([json], "field.json");
  const url = URL.createObjectURL(file);
  
  const link = document.createElement("a");
  link.download = "field.json"
  link.href = url;
  link.click();
  link.remove();
}

function loadField (json) {
  let loadedPlots = JSON.parse(json).plots;
  for (let i = 0; i < loadedPlots.length; i++) {
    let plot = loadedPlots[i];
    
    // Create svg
    const newPlot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    newPlot.setAttribute("x", plot.x);
    newPlot.setAttribute("y", plot.y);
    newPlot.setAttribute("width", plot.width);
    newPlot.setAttribute("height", plot.height);
    newPlot.style.fill = "#201002";
    if (plot.type == 2) newPlot.style.fill = "#aa0000";
    
    let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", parseInt(plot.x) + parseInt(plot.width / 2));
    label.setAttribute("y", parseInt(plot.y) + parseInt(plot.height / 2));
    label.setAttribute("lengthAdjust", "spacingAndGlyphs");
    // label.setAttribute("textLength", 10);
    label.style.fill = "#ffffff";
    label.style.stroke = "#000000";
    label.style.strokeWidth = "2px";
    label.style.font = "bold 30px sans-serif";
    label.setAttribute("text-anchor", "middle")
    label.zIndex = 10;
    
    
    label.textContent = plot.name;
    plot.label = label
    
    if (plot.fence) {
      newPlot.style.stroke = "#ddccbb";
      newPlot.style.strokeWidth = 5;
      newPlot.style.strokeDasharray = "50,10";
      // newPlot.setAttribute("stroke-dasharray", "10,10")
    }
    else {
      newPlot.style.strokeWidth = 0;
    }
    
    
    
    // TODO: remove this side effect
    svg.appendChild(newPlot)
    plots.push(plot)
    svg.appendChild(label);
    
    // Listen for deletion
    newPlot.addEventListener("click", (event) => {
      if (tool == 3) del(event);
    })
    
    // Add svg to plot data (it was deleted during the save process)
    plot.svg = newPlot
    
  }
  
  return loadedPlots;
}
