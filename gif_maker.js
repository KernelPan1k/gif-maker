const fs = require('fs.extra');
const swal = require('sweetalert');
const _ = require('underscore');
const path = require('path');
const messages = require('./message.fr.json');
const s = require('underscore.string');
const gui = require('nw.gui');
const win = gui.Window.get();

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
            project = new Project(baseOutputPath, name);
            createButton.className = 'hidden';
            deleteProjectButton.className = '';
            notify(messages.success.ok, 'success');
            scroll(uploadPage);
        });
    });
};

const deleteProjectMethod = () => {
    const path = project.path;

    fs.exists(path, (exist) => {
        if (!exist) {
            notify(messages.error.unknown_project, 'error');
            return;
        }

        fs.rmrf(path, (err) => {
            if (err) {
                notify(err.toString(), 'error');
                return;
            }

            project = null;
            createButton.className = '';
            deleteProjectButton.className = 'hidden';
            notify(messages.success.ok, 'success');
        });
    });
};

const quitMethod = () => {
    win.close();
    return process.exit();
};

const fixBehavior = () => {
    window.ondragover = window.ondrop = function (e) {
        e.preventDefault();
        return false;
    };
};

const dragOverMethod = () => {
    document.querySelector('#uploadPageMessage').innerHTML = messages.drag.over;
};

const dragLeaveMethod = () => {
    document.querySelector('#uploadPageMessage').innerHTML = messages.drag.leave;
};

const isPicture = (mime) => _.contains(['image/gif', 'image/jpeg', 'image/png'], mime);

const getFileNameByPath = (path) => ('/' === path.slice(-1)) ? path.split('/').splice(-2, 1) : path.split('/').pop();

const cpFileFromDisk = from => new Promise((resolve, reject) => {
    let fileName = getFileNameByPath(from).replace('_%d', '_0');
    let folder = s(fileName.replace('_%d', '').split('.')[0]).clean();

    fs.exists(`${project.path}${folder}`, (exist) => {
        if (exist) {
            let nbr = 0;

            fs.readdirSync(project.path).filter((el) => {
                if (
                    fs.statSync(path.join(project.path, el)).isDirectory()
                    && new RegExp(`^(_([0-9]+))${folder}$`).test(el)
                ) {
                    nbr+=1;
                }
            });

            folder = `_ ${nbr}${folder}`;
        }

        fs.mkdir(`${project.path}${folder}`, () => {
            const to = `${project.path}${folder}/_0${fileName}`;

            fs.copy(from, to, {replace: false}, (err) => {
                if (err) {
                    reject(err);
                }

                resolve(to);
            });
        });
    });
});

const uploadMethod = (event) => {
    event.preventDefault();

    const element = event.currentTarget;
    const files = ('undefined' !== typeof event.dataTransfer) ? event.dataTransfer.files : element.files;

    _.each(files, (file) => {
        if (!isPicture(file['type'])) {
            notify('Erreur de type mime', 'error');
        } else {
            cpFileFromDisk(file.path)
                .then((to) => {
                    // const picture = new Picture(to);
                    // picture.identify();
                    // project.pictures.push(picture);
                    // project.rank.push(picture.id);
                    notify(messages.success.ok, 'success');
                })
                .catch(err => notify(err.toString(), 'error'));
        }
    });

    uploadFileButton.value = null;
};


const startDragMethod = () => {};
const loadPictureMethod = () => {};
const loadPreviewMethod = () => {};
const editPictureMethod = () => {};
const duplicateMethod = () => {};
const prepareFusionLoadMethod = () => {};
const fusionLoadMethod = () => {};
const makeFusionMethod = () => {};
const ratioMethod = () => {};
const sizeMethod = () => {};
const toogleDragResizeMethod = () => {};
const stopDragMethod = () => {};
const buildMethod = () => {};

fixBehavior();

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
