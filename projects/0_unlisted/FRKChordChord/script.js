document.addEventListener("DOMContentLoaded", (event) => {
    let dragged;

    function dragStart(event) {
        dragged = event.target;
        event.target.style.opacity = .5;
        event.dataTransfer.setData("text/plain", null);
    }

    function dragEnd(event) {
        event.target.style.opacity = "";
        event.target.style.backgroundColor = "";
        event.target.removeAttribute("data-dragging");
    }

    function applyDraggableAttributes(element) {
        element.setAttribute("data-draggable", "true");
        element.setAttribute("draggable", "true");
        element.addEventListener("dragstart", dragStart, false);
        element.addEventListener("dragend", dragEnd, false);
    }

    const draggableElements = document.querySelectorAll("[data-draggable='true']");

    draggableElements.forEach((element) => {
        applyDraggableAttributes(element);
    });

    document.addEventListener("dragover", function (event) {
        event.preventDefault();
    }, false);

    document.addEventListener("dragenter", function (event) {
        if (event.target.className == "grid-item" && event.target.getAttribute("data-draggable") === "true") {
            event.target.style.background = "#F1F1F1";
        }
    }, false);

    document.addEventListener("dragleave", function (event) {
        if (event.target.className == "grid-item" && event.target.getAttribute("data-draggable") === "true") {
            event.target.style.background = "";
        }
    }, false);

    document.addEventListener("drop", function (event) {
        event.preventDefault();

        // If the element is a grid-item and is draggable and the dragged element is not the same as the target element
        if (event.target.className == "grid-item" && event.target.getAttribute("data-draggable") === "true" && dragged !== event.target) {
            let targetClone = event.target.cloneNode(true);
            let draggedClone = dragged.cloneNode(true);
            event.target.parentNode.replaceChild(draggedClone, event.target);
            dragged.parentNode.replaceChild(targetClone, dragged);
    
            targetClone.style.backgroundColor = "";
            draggedClone.style.backgroundColor = "";
            draggedClone.style.opacity = "";
            draggedClone.removeAttribute("data-dragging");

            applyDraggableAttributes(targetClone);
            applyDraggableAttributes(draggedClone);
        }
    }, false);
    
});