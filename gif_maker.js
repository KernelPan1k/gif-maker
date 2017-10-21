const fs = require('fs');
const swal = require('sweetalert');
const _ = require('underscore');
const messages = require('./message.fr.json');
const s = require('underscore.string');

const baseOutputPath = process.env.PWD + '/output/';
let project = null;

const uploadPage = document.querySelector('#uploadPage');
const createButton = document.querySelector('#createProjectButton');
const deleteProjectButton = document.querySelector('#deleteProjectButton');
const uploadFileButton = document.querySelector('#uploadFileButton');
const submitEditButton = document.querySelector('#submitEditButton');
const duplicateButton = document.querySelector('#duplicateButton');
const fusionButton = document.querySelector('#fusionButton');
const loadFusionButton = document.querySelector('#loadFusionButton');
const makeFusionButton = document.querySelector('#makeFusionButton');
const projectNameInput = document.querySelector('#projectNameInput');
const editWidthInput = document.querySelector('#editWidthInput');
const editHeightInput = document.querySelector('#editHeightInput');
const pictureIdHidden = document.querySelector('#pictureIdHidden');
const ratioCheckbox = document.querySelector('#ratioCheckbox');
const useAtBgCheckbox = document.querySelector('#useAtBgCheckbox');
const explodeGifCheckbox = document.querySelector('#explodeGifCheckbox');
const updatePicturePageLink = document.querySelector('#updatePicturePageLink');
const quitLink = document.querySelector('#quitLink');
const editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
const deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
const usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');
const updatePreviewPageLink = document.querySelector('#updatePreviewPageLink');
const pictureTable = document.querySelector('#pictureTable');
const fusionContainer = document.querySelector('#fusionContainer');
const pictureFusion = document.querySelector('#pictureFusion');
const previewPicture = document.querySelector('#previewPicture');

const scroll = (target) => {
    return window.scrollTo(0, target.offsetTop);
};

const notify = (text, type, arg, callback) => {
    const title =
        ('success' === type)
            ? messages.alert_title.success
            : ('warning' === type)
                ? messages.alert_title.warning
                : ('error' === type)
                    ? messages.alert_title.error
                    : ('confirm' === type)
                        ? messages.alert_title.confirmation
                        : messages.alert_title.message;

    if ('confirm' === type) {
        return swal({
            title: title,
            text: text,
            type: 'info',
            showCancelButton: true,
            confirmButtonText: messages.button.confirm,
            cancelButtonText: messages.button.cancel,
            closeOnConfirm: true,
            closeOnCancel: true,
        }, (isConfirm) => {
            if (isConfirm) {
                return callback ? callback(arg) : true;
            }
        });
    }

    return swal(title, text, type);
};

const createProjectMethod = () => {
    const name = s(projectNameInput.value).clean().trim().value();
    const path = baseOutputPath + name;

    fs.exists(path, (exist) => {
        if (exist) {
            notify(messages.error.project_exist, 'error');
            return;
        }

        fs.mkdir(path, () => {
            project = new Project(this.baseOutputPath, name);
            createButton.className = 'hidden';
            deleteProjectButton.className = '';
            notify(messages.success.ok, 'success');
            scroll(uploadPage);
        });
    });
};

const deleteProjectMethod = () => {};
const loadPictureMethod = () => {};
const loadPreviewMethod = () => {};
const editPictureMethod = () => {};
const duplicateMethod = () => {};
const prepareFusionLoadMethod = () => {};
const fusionLoadMethod = () => {};
const makeFusionMethod = () => {};
const ratioMethod = () => {};
const sizeMethod = () => {};
const uploadMethod = () => {};
const dragOverMethod = () => {};
const dragLeaveMethod = () => {};
const startDragMethod = () => {};
const toogleDragResizeMethod = () => {};
const quitMethod = () => {};
const stopDragMethod = () => {};
const buildMethod = () => {};

createButton.addEventListener('click', createProjectMethod, false);
deleteProjectButton.addEventListener('click', deleteProjectMethod, false);
updatePicturePageLink.addEventListener('click', loadPictureMethod, false);
updatePreviewPageLink.addEventListener('click', loadPreviewMethod, false);
submitEditButton.addEventListener('click', editPictureMethod, false);
duplicateButton.addEventListener('click', duplicateMethod, false);
fusionButton.addEventListener('click', prepareFusionLoadMethod, false);
loadFusionButton.addEventListener('click', fusionLoadMethod, false);
makeFusionButton.addEventListener('click', makeFusionMethod, false);
ratioCheckbox.addEventListener('click', ratioMethod, false);
editHeightInput.addEventListener('blur', sizeMethod, false);
editWidthInput.addEventListener('blur', sizeMethod, false);
uploadPage.addEventListener('drop', uploadMethod, false);
uploadFileButton.addEventListener('change', uploadMethod, false);
uploadPage.addEventListener('dragover', dragOverMethod, false);
uploadPage.addEventListener('dragleave', dragLeaveMethod, false);
pictureFusion.addEventListener('mousedown', startDragMethod, false);
fusionContainer.addEventListener('mouseup', stopDragMethod, false);
pictureFusion.addEventListener('dblclick', toogleDragResizeMethod, false);
quitLink.addEventListener('click', quitMethod, false);
document.querySelector('#buildButton').addEventListener('click', buildMethod, false);

class Project {
    constructor(base, name) {
        this.path = base + name + '/';
        this.name = name;
        this.pictures = [];
        this.rank = [];
    }
}
