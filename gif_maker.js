import { fs } from 'fs';
import { swal } from 'sweetalert';
import { _ } from 'underscore';

class GifMaker {
    constructor() {
        this.project = undefined;
        this.utils = new Utils();
        GifMaker.fixBehavior();
        this.getDOMElements();
        this.bindEvents();
        this.baseOutputPath = process.env.PWD + '/output/';
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
        const name = this.utils.slugify(_.trim(this.projectNameInput.value));
        const path = this.baseOutputPath + name;

        fs.exists(path, (exist) => {
            if (exist) {
                this.utils.notify('Un projet du même nom existe déjà', 'error');
                return;
            }

            fs.mkdir(path, () => {
                this.project = new Project(this.baseOutputPath, name);
                this.createButton.className = 'hidden';
                this.deleteProjectButton.className = '';
                this.utils.notify('ok', 'success');
                Utils.scroll(this.uploadPage);
            });
        });
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

class Utils {
    static scroll(target) {
        return window.scrollTo(0, target.offsetTop);
    }

    slugify(s) {
        let str = s;
        const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
        const to = 'aaaaeeeeiiiioooouuuunc------';

        str = str.replace(/^\s+|\s+$/g, '');
        str = str.toLowerCase();

        _.each(from, (f, i) => {
            str = str.replace(new RegExp(f, 'g'), to.charAt(i));
        });

        str = str
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        return str;
    }

    notify(text, type, arg, callback) {
        const title =
            ('success' === type)
                ? 'Bravo'
                : ('warning' === type)
                ? 'Attention'
                : ('error' === type)
                    ? 'Erreur'
                    : ('confirm' === type)
                        ? 'Confirmation'
                        : 'Message';

        if ('confirm' === type) {
            return swal({
                title: title,
                text: text,
                type: 'info',
                showCancelButton: true,
                confirmButtonText: 'Confirmer',
                cancelButtonText: 'Annuler',
                closeOnConfirm: true,
                closeOnCancel: true,
            }, (isConfirm) => {
                if (isConfirm) {
                    return callback ? callback(arg) : true;
                }
            });
        }

        return swal(title, text, type);
    }
}

class Project {
    constructor(base, name) {
        this.path = base + name + '/';
        this.name = name;
        this.pictures = [];
        this.rank = [];
    }
}
