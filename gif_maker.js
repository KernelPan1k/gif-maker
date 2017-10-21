
class GifMaker {
    constructor() {
        GifMaker.fixBehavior();
        this.getDOMElements();
        this.bindEvents();
    }

    getDOMElements() {
        this.uploadPage = document.querySelector('#uploadPage');
        this.createButton = document.querySelector('#createProjectButton');
        this.deleteProjectButton = document.querySelector('#deleteProjectButton');
        this.uploadFileButton = document.querySelector('#uploadFileButton');
        this.submitEditButton = document.querySelector('#submitEditButton');
        this.duplicateButton = document.querySelector('#duplicateButton');
        this.fusionButton = document.querySelector('#fusionButton');
        this.loadFusionButton = document.querySelector('#loadFusionButton');
        this.makeFusionButton = document.querySelector('#makeFusionButton');
        this.projectNameInput = document.querySelector('#projectNameInput');
        this.editWidthInput = document.querySelector('#editWidthInput');
        this.editHeightInput = document.querySelector('#editHeightInput');
        this.pictureIdHidden = document.querySelector('#pictureIdHidden');
        this.ratioCheckbox = document.querySelector('#ratioCheckbox');
        this.useAtBgCheckbox = document.querySelector('#useAtBgCheckbox');
        this.explodeGifCheckbox = document.querySelector('#explodeGifCheckbox');
        this.updatePicturePageLink = document.querySelector('#updatePicturePageLink');
        this.quitLink = document.querySelector('#quitLink');
        this.editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
        this.deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
        this.usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');
        this.updatePreviewPageLink = document.querySelector('#updatePreviewPageLink');
        this.pictureTable = document.querySelector('#pictureTable');
        this.fusionContainer = document.querySelector('#fusionContainer');
        this.pictureFusion = document.querySelector('#pictureFusion');
        this.previewPicture = document.querySelector('#previewPicture');
    }

    bindEvents() {
        this.createButton.addEventListener('click', this.createProjectMethod, false);
        this.deleteProjectButton.addEventListener('click', this.deleteProjectMethod, false);
        this.updatePicturePageLink.addEventListener('click', this.loadPictureMethod, false);
        this.updatePreviewPageLink.addEventListener('click', this.loadPreviewMethod, false);
        this.submitEditButton.addEventListener('click', this.editPictureMethod, false);
        this.duplicateButton.addEventListener('click', this.duplicateMethod, false);
        this.fusionButton.addEventListener('click', this.prepareFusionLoadMethod, false);
        this.loadFusionButton.addEventListener('click', this.fusionLoadMethod, false);
        this.makeFusionButton.addEventListener('click', this.makeFusionMethod, false);
        this.ratioCheckbox.addEventListener('click', this.ratioMethod, false);
        this.editHeightInput.addEventListener('blur', this.sizeMethod, false);
        this.editWidthInput.addEventListener('blur', this.sizeMethod, false);
        this.uploadPage.addEventListener('drop', this.uploadMethod, false);
        this.uploadFileButton.addEventListener('change', this.uploadMethod, false);
        this.uploadPage.addEventListener('dragover', this.dragOverMethod, false);
        this.uploadPage.addEventListener('dragleave', this.dragLeaveMethod, false);
        this.pictureFusion.addEventListener('mousedown', this.startDragMethod, false);
        this.fusionContainer.addEventListener('mouseup', this.stopDragMethod, false);
        this.pictureFusion.addEventListener('dblclick', this.toogleDragResizeMethod, false);
        this.quitLink.addEventListener('click', this.quitMethod, false);
        document.querySelector('#buildButton').addEventListener('click', this.buildMethod, false);
    }

    static fixBehavior() {
        window.ondragover = window.ondrop = (event) => {
            event.preventDefault();
            return false;
        };
    }

    createProjectMethod() {

    }

    deleteProjectMethod() {

    }

    loadPictureMethod() {

    }

    loadPreviewMethod() {

    }

    editPictureMethod() {

    }

    duplicateMethod() {

    }

    prepareFusionLoadMethod() {

    }

    fusionLoadMethod() {

    }

    makeFusionMethod() {

    }

    ratioMethod() {

    }

    sizeMethod() {

    }

    uploadMethod() {

    }

    dragOverMethod() {

    }

    dragLeaveMethod() {

    }

    startDragMethod() {

    }

    stopDragMethod() {

    }

    toogleDragResizeMethod() {

    }

    quitMethod() {

    }
}
