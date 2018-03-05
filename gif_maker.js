(function () {

    "use strict";

    /** IMPORT */
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var fs = require('fs.extra');
    var path = require('path');
    var im = require('imagemagick');
    var imc = require("imagemagick-composite");
    var mm = null;

    var MMGifMaker = function () {
        this._baseOutputPath = process.env.PWD + '/output/';
        this.project = null;
        // page
        this._uploadPage = document.querySelector('#uploadPage');
        // button
        this._createButton = document.querySelector('#createProjectButton');
        this._deleteProjectButton = document.querySelector('#deleteProjectButton');
        this._uploadFileButton = document.querySelector('#uploadFileButton');
        this._submitEditButton = document.querySelector('#submitEditButton');
        this._duplicateButton = document.querySelector('#duplicateButton');
        this._fusionButton = document.querySelector('#fusionButton');
        this._loadFusionButton = document.querySelector('#loadFusionButton');
        this._makeFusionButton = document.querySelector('#makeFusionButton');
        // Input text
        this._projectNameInput = document.querySelector('#projectNameInput');
        this._editWidthInput = document.querySelector('#editWidthInput');
        this._editHeightInput = document.querySelector('#editHeightInput');
        // Input others
        this._pictureIdHidden = document.querySelector('#pictureIdHidden');
        this._ratioCheckbox = document.querySelector('#ratioCheckbox');
        this._useAtBgCheckbox = document.querySelector('#useAtBgCheckbox');
        this._explodeGifCheckbox = document.querySelector('#explodeGifCheckbox');
        // Link
        this._updatePicturePageLink = document.querySelector('#updatePicturePageLink');
        this._quitLink = document.querySelector('#quitLink');
        this._editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
        this._deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
        this._usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');
        this._updatePreviewPageLink = document.querySelector('#updatePreviewPageLink');
        // Block
        this._pictureTable = document.querySelector('#pictureTable');
        this._fusionContainer = document.querySelector('#fusionContainer');
        this._pictureFusion = document.querySelector('#pictureFusion');
        this._previewPicture = document.querySelector('#previewPicture');
        this.fixBehavior = function () {
            window.ondragover = window.ondrop = function (e) {
                e.preventDefault();
                return false;
            };
        };
        this.bindEvent = function () {
            this._createButton.addEventListener('click', this.createProject_, false);
            this._deleteProjectButton.addEventListener('click', this.deleteProject_, false);
            this._updatePicturePageLink.addEventListener('click', this.loadPicture_, false);
            this._updatePreviewPageLink.addEventListener('click', this.loadPreview_, false);
            this._submitEditButton.addEventListener('click', this.editPicture_, false);
            this._duplicateButton.addEventListener('click', this.duplicate_, false);
            this._fusionButton.addEventListener('click', this.prepareFusionLoad_, false);
            this._loadFusionButton.addEventListener('click', this.fusionLoad_, false);
            this._makeFusionButton.addEventListener('click', this.makeFusion_, false);
            this._ratioCheckbox.addEventListener('click', this.ratio_, false);
            this._editHeightInput.addEventListener('blur', this.size_, false);
            this._editWidthInput.addEventListener('blur', this.size_, false);
            this._uploadPage.addEventListener('drop', this.upload_, false);
            this._uploadFileButton.addEventListener('change', this.upload_, false);
            this._uploadPage.addEventListener('dragover', this.dragOver_, false);
            this._uploadPage.addEventListener('dragleave', this.dragLeave_, false);
            this._pictureFusion.addEventListener('mousedown', this.startDrag_, false);
            this._fusionContainer.addEventListener('mouseup', this.stopDrag_, false);
            this._pictureFusion.addEventListener('dblclick', this.toogleDragResize_, false);
            this._quitLink.addEventListener('click', this.quit_, false);
            document.querySelector('#buildButton').addEventListener('click', this.build_, false);
        };
        this.initialize = function () {
            this.fixBehavior();
            this.bindEvent();
        };
        /** Create a new project */
        this.createProject_ = function () {
            var name = mm.slugify(mm._projectNameInput.value);
            var path = mm._baseOutputPath + name;
            fs.exists(path, function (exist) {
                if (exist) return mm.notify("Un projet du même nom existe déjà ", 'error');
                fs.mkdir(path, function () {
                    mm.project = new Project(mm._baseOutputPath, name);
                    mm._createButton.className = 'hidden';
                    mm._deleteProjectButton.className = '';
                    mm.scroll(mm._uploadPage);
                    return mm.notify("ok", 'success');
                });
            });
        };
        /** Delete current project */
        this.deleteProject_ = function () {
            var path = mm.project.path;
            fs.exists(path, function (exist) {
                if (!exist) return mm.notify("Projet introuvable", 'error');
                fs.rmrf(path, function (err) {
                    if (err) throw  err;
                    mm.project = null;
                    mm._createButton.className = '';
                    mm._deleteProjectButton.className = 'hidden';
                    return mm.notify("ok", 'success');
                });
            });
        };
        /** drag enter event */
        this.dragOver_ = function () {
            document.querySelector('#uploadPageMessage').innerHTML = "DÃ©posez le fichier";
            return false;
        };
        /** drag leave event */
        this.dragLeave_ = function () {
            document.querySelector('#uploadPageMessage').innerHTML = "Glisser le fichier ou ...";
            return false;
        };
        /** Upload handler by drop or classical method  */
        this.upload_ = function (e) {
            e.preventDefault();
            var el = e.target;
            var files = ('undefined' !== typeof e.dataTransfer) ? e.dataTransfer.files : el.files;
            for (var i = 0, l = files.length; i < l; i++) {
                if (mm.isPicture(files[i]["type"])) {
                    mm.cpFileFromDisk(files[i].path, function (path) {
                        var picture = new Picture(path);
                        picture.identify();
                        mm.project.pictures.push(picture);
                        mm.project.rank.push(picture.id);
                        mm.notify("ok", 'success');
                    });
                }
                else mm.notify('Erreur de type mime', 'error');
            }
            mm._uploadFileButton.value = null;
        };
        /** Event for dynamical tags */
        this.dynamicEvent = function () {
            this._editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
            this._deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
            this._usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');
            for (var i = 0, l = this._editPictureCollectionLink.length; i < l; i++) {
                this._editPictureCollectionLink[i].addEventListener('click', this.loadEditPicture_, false);
                this._deletePictureCollectionLink[i].addEventListener('click', this.loadDeletePicture_, false);
                this._usePictureCollectionLink[i].addEventListener('click', this.usePicture_, false);
            }
            var that = this;
            var sortable = new Sortable(this._pictureTable, {
                handle: '.sortable',
                animation: 150,
                onUpdate: function () {
                    var row = document.querySelectorAll('.pictureEditRow');
                    that.project.rank = [];
                    for (var r = 0, l = row.length; r < l; r++) {
                        that.project.rank.push(row[r].getAttribute('data-image'));
                    }
                }
            });
        };
        /** Load picture */
        this.loadPicture_ = function () {
            if (null === mm.project) {
                return mm.notify("Vous devez créer un projet", "warning");
            }
            mm._pictureTable.innerHTML = '';
            if (0 === mm.project.pictures.length) {
                return mm.notify("Aucune image pour ce projet", "warning");
            }
            var template = document.querySelector("#pictureTemplate").innerHTML;
            var ranks = mm.project.rank;
            for (var r in ranks) {
                if (ranks.hasOwnProperty(r)) {
                    var picture = mm.project.getPictureById(ranks[r]);
                    picture.setBg();
                    mm._pictureTable.innerHTML +=
                        template
                            .replace("%src%", 'output/' + path.relative(mm._baseOutputPath, picture.getpath() + '?d=' + Date.now()))
                            .replace("%info%", picture.nbr + " images")
                            .replace(new RegExp('%data%', 'g'), picture.id);
                }
            }
            mm.dynamicEvent();
        };
        /** hydrate form in picture edit view */
        this.loadEditPicture_ = function () {
            document.querySelector('#jpg').className = 'hidden';
            document.querySelector('#gif').className = 'hidden';
            var id = this.getAttribute('data-image');
            var picture = mm.project.getPictureById(id);
            mm._pictureIdHidden.value = id;
            mm._editWidthInput.value = picture.width;
            mm._editHeightInput.value = picture.height;
            switch (picture.format) {
                case 'JPG':
                case 'JPEG':
                case 'PNG':
                    if (!picture.isExplode) {
                        document.querySelector('#jpg').className = '';
                        mm._useAtBgCheckbox.checked = (null === picture.isBg) ? true : picture.isBg;
                    }
                    break;
                case 'GIF':
                    document.querySelector('#gif').className = '';
                    mm._explodeGifCheckbox.checked = picture.isExplode;
                    if (picture.isExplode) mm._explodeGifCheckbox.setAttribute('disabled', 'disabled');
                    else mm._explodeGifCheckbox.removeAttribute('disabled');
                    break;
            }
            return mm.scroll(document.querySelector('#editPage'));
        };
        /** Event when call delete picture */
        this.loadDeletePicture_ = function () {
            var picture = mm.project.getPictureById(this.getAttribute('data-image'));
            mm.notify("Etes-vous certain de vouloir supprimer cette image ?", 'confirm', picture, function (picture) {
                fs.rmrf(picture.rootpath, function (err) {
                    if (err) throw err;
                    mm.project.removePicture(picture.id);
                    mm.loadPicture_();
                    mm.notify("Image supprimée avec succès", 'success');
                });
            });
        };
        /** Prepare usePicture view */
        this.usePicture_ = function () {
            mm._loadFusionButton.className = 'hidden';
            document.querySelector('#containerUseBackground').innerHTML = '';
            var id = this.getAttribute('data-image');
            var picture = mm.project.getPictureById(id);
            var parent = mm._fusionButton.parentNode;
            parent.className = 'hidden';
            mm._duplicateButton.setAttribute('data-use', id);
            if (!picture.isBg) {
                if (picture.isGif() && !picture.isExplode) {
                    mm.notify("Ce gif n'est pas décomposé", 'warning');
                } else {
                    mm._fusionButton.setAttribute('data-use', id);
                    parent.className = '';
                }
            }
            return mm.scroll(document.querySelector('#usePicturePage'));
        };
        /** Edit picture */
        this.editPicture_ = function () {
            var message = [];
            var picture = mm.project.getPictureById(mm._pictureIdHidden.value);
            var factory = new Factory(picture);
            var callback = false;
            var decompose = picture.isGif() && mm._explodeGifCheckbox.checked && !picture.isExplode;
            if (!picture.isGif() && !picture.isExplode) {
                picture.isBg = mm._useAtBgCheckbox.checked;
                var str = (picture.isBg) ? "l'image est un background" : "L'image n'est pas un background";
                message.push(str);
            }
            if (mm._editWidthInput.value != picture.width || mm._editHeightInput.value != picture.height) {
                callback = decompose;
                if (callback) factory.resize(mm._editWidthInput.value, mm._editHeightInput.value, 0, mm);
                else factory.resize(mm._editWidthInput.value, mm._editHeightInput.value);
                if (picture.isBg) {
                    var others = mm.project.pictures;
                    for (var o in others) {
                        if (others.hasOwnProperty(o)) {
                            var p = others[o];
                            if (p.isBg && p.id !== picture.id) {
                                var f = new Factory(p);
                                f.resize(mm._editWidthInput.value, mm._editHeightInput.value);
                            }
                        }
                    }
                    message.push("Tous les backgrounds ont Ã©tÃ© redimensionnÃ©s");
                }
                else message.push("L'image a Ã©tÃ© redimensionÃ©e");
            }
            if (decompose) {
                mm._explodeGifCheckbox.setAttribute('disabled', 'disabled');
                message.push("Le gif a Ã©tÃ© dÃ©composÃ©");
                if (!callback) {
                    factory.decompose();
                }
            }
            if (0 !== message.length) {
                mm.notify(message.join('\n'), 'success');
            }
        };
        /** load picture size for use ratio */
        this.ratio_ = function () {
            if (this.checked) {
                var picture = mm.project.getPictureById(mm._pictureIdHidden.value);
                mm._editWidthInput.value = picture.width;
                mm._editHeightInput.value = picture.height;
                return true;
            }
            return null;
        };
        /** Keep picture ratio */
        this.size_ = function () {
            if (!mm._ratioCheckbox.checked) return false;
            var picture = mm.project.getPictureById(mm._pictureIdHidden.value);
            if (this.getAttribute('id') === mm._editWidthInput.getAttribute('id')) {
                return mm._editHeightInput.value = Math.round((picture.height / picture.width) * mm._editWidthInput.value);
            } else if (this.getAttribute('id') === mm._editHeightInput.getAttribute('id')) {
                return mm._editWidthInput.value = Math.round((picture.width / picture.height) * mm._editHeightInput.value);
            }
            return false;
        };
        /** Duplicate picture */
        this.duplicate_ = function () {
            var picture = mm.project.getPictureById(this.getAttribute('data-use'));
            mm.cpFolderContent(picture.path, function (to) {
                mm.project.clonePicture(picture, to + picture.name);
                mm.notify("ok", 'success');
            });
        };
        /** prepare page fusion */
        this.prepareFusionLoad_ = function () {
            var picture = mm.project.getPictureById(this.getAttribute('data-use'));
            var container = document.querySelector('#containerUseBackground');
            container.innerHTML = '';
            var template = document.querySelector('#backgroundTemplate').innerHTML;
            var pictures = mm.project.pictures;
            var hidden = 'hidden';
            for (var p in pictures) {
                if (pictures.hasOwnProperty(p) && pictures[p].isBg) {
                    hidden = '';
                    container.innerHTML +=
                        template
                            .replace("%src%", 'output/' + path.relative(mm._baseOutputPath, pictures[p].getpath() + '?d=' + Date.now()))
                            .replace('%id%', pictures[p].id);
                }
            }
            if ('hidden' === hidden) {
                container.innerHTML = 'Aucun background enregistrÃ©';
            }
            else {
                mm._loadFusionButton.setAttribute('data-use', picture.id);
            }
            mm._loadFusionButton.className = hidden;
        };
        /** Page drag and drop */
        this.fusionLoad_ = function () {
            var bgList = document.querySelectorAll('.bgList:checked');
            var picture = mm.project.getPictureById(this.getAttribute('data-use'));
            var bgListId = [];
            if (0 === bgList.length) {
                return mm.notify("Vous devez sélectionner des backgrounds", "error");
            }
            for (var i = 0, l = bgList.length; i < l; i++) {
                bgListId.push(bgList[i].getAttribute('data-bg'));
            }
            var bgForWork = mm.project.getPictureById(bgListId[0]);
            mm._fusionContainer.style.width = bgForWork.width + 'px';
            mm._fusionContainer.style.height = bgForWork.height + 'px';
            mm._fusionContainer.style.background = "url(%s) center center no-repeat".replace('%s', 'output/' + path.relative(mm._baseOutputPath, bgForWork.getpath() + '?d=' + Date.now()));
            mm._pictureFusion.style.width = picture.width;
            mm._pictureFusion.style.height = picture.height;
            mm._pictureFusion.src = 'output/' + path.relative(mm._baseOutputPath, picture.getpath() + '?d=' + Date.now());
            mm._pictureFusion.style.left = '10px';
            mm._pictureFusion.style.top = '10px';
            mm._fusionContainer.setAttribute('data-picture', picture.id);
            mm._fusionContainer.setAttribute('data-picture', picture.id);
            mm._fusionContainer.setAttribute('data-bg', bgListId.join(','));
            mm.scroll(document.querySelector('#fusionPage'));
        };
        /** mousedown */
        this.startDrag_ = function (e) {
            e.preventDefault();
            var offsetX = e.clientX;
            var offsetY = e.clientY;
            switch (this.className) {
                case 'drag':
                    if (!this.style.left) {
                        this.style.left = '10px'
                    }
                    if (!this.style.top) {
                        this.style.top = '10px'
                    }
                    mm._pictureFusion.setAttribute('data-coord-x', this.style.left.toString());
                    mm._pictureFusion.setAttribute('data-coord-y', this.style.top.toString());
                    mm._pictureFusion.setAttribute('data-offset-x', offsetX.toString());
                    mm._pictureFusion.setAttribute('data-offset-y', offsetY.toString());
                    mm._pictureFusion.setAttribute('data-action', 'drag');
                    mm._fusionContainer.addEventListener('mousemove', mm._moveDrag, false);
                    return false;
                    break;
                case 'resize':
                    mm._pictureFusion.setAttribute('data-offset-x', offsetX.toString());
                    mm._pictureFusion.setAttribute('data-offset-y', offsetY.toString());
                    mm._pictureFusion.setAttribute('data-start-width', parseInt(document.defaultView.getComputedStyle(mm._pictureFusion, null).width, 10).toString());
                    mm._pictureFusion.setAttribute('data-start-height', parseInt(document.defaultView.getComputedStyle(mm._pictureFusion, null).height, 10).toString());
                    mm._pictureFusion.setAttribute('data-action', 'resize');
                    mm._fusionContainer.addEventListener('mousemove', mm._moveDrag, false);
                    break;
                default:
                    return false;
                    break;
            }
        };
        /** mousemove */
        this._moveDrag = function (e) {
            var el = e.target;
            var offsetX = parseInt(el.getAttribute('data-offset-x'));
            var offsetY = parseInt(el.getAttribute('data-offset-y'));
            switch (el.getAttribute('data-action')) {
                case 'drag':
                    var coordX = parseInt(el.getAttribute('data-coord-x'));
                    var coordY = parseInt(el.getAttribute('data-coord-y'));
                    el.style.left = coordX + e.clientX - offsetX + 'px';
                    el.style.top = coordY + e.clientY - offsetY + 'px';
                    return false;
                    break;
                case 'resize':
                    mm._pictureFusion.style.width = (parseInt(el.getAttribute('data-start-width')) + e.clientX - offsetX) + 'px';
                    mm._pictureFusion.style.height = (parseInt(el.getAttribute('data-start-height')) + e.clientY - offsetY) + 'px';
                    break;
                default:
                    return false;
                    break;
            }
        };
        /** mouseup */
        this.stopDrag_ = function () {
            mm._pictureFusion.setAttribute('data-coord-x', mm._pictureFusion.style.left.toString());
            mm._pictureFusion.setAttribute('data-coord-y', mm._pictureFusion.style.top.toString());
            mm._pictureFusion.setAttribute('data-action', '');
        };
        /** update class */
        this.toogleDragResize_ = function () {
            this.className = 'drag' === this.className ? 'resize' : 'drag';
        };
        this.makeFusion_ = function () {
            var picture = mm.project.getPictureById(mm._fusionContainer.getAttribute('data-picture'));
            var bgList = mm._fusionContainer.getAttribute('data-bg').split(',');
            var left = mm._pictureFusion.style.left;
            var top = mm._pictureFusion.style.top;
            var width = mm._pictureFusion.offsetWidth;
            var height = mm._pictureFusion.offsetHeight;
            var transformer = new Transformer(picture, bgList, left, top, width, height);
            transformer.fusion();
        };
        /** ger good ratio */
        this.calculateAspectRatio = function (srcWidth, srcHeight, maxWidth, maxHeight, ratio) {
            ratio = (null === ratio || 'undefined' === typeof ratio) ? Math.min(maxWidth / srcWidth, maxHeight / srcHeight) : ratio;

            return {width: srcWidth * ratio, height: srcHeight * ratio, ratio: ratio};
        };
        this.loadPreview_ = function () {
            var paths = [];
            var date = Date.now();
            var list = mm.project.rank;
            var dimension = null;
            var interval = null;
            for (var l in list) {
                if (list.hasOwnProperty(l)) {
                    var current = mm.project.getPictureById(list[l]);
                    for (var i = 0; i < current.nbr; i++) {
                        paths.push('output/' + path.relative(mm._baseOutputPath, current.getpath(i) + '?d=' + date));
                        if (current.isBg && null === dimension) {
                            dimension = mm.calculateAspectRatio(current.width, current.height, 800, 700);
                        }
                    }
                }
            }
            mm._previewPicture.setAttribute('src', paths[0]);
            mm._previewPicture.style.width = dimension.width;
            mm._previewPicture.style.height = dimension.height;
            document.querySelector('#previewButton').addEventListener('click', function (e) {
                var el = e.target;
                if (null === interval) {
                    var speed = parseInt(document.querySelector('#speedInput').value);
                    var i = 0;
                    el.value = "Stopper la preview";
                    interval = setInterval(function () {
                        mm._previewPicture.setAttribute('src', paths[i]);
                        i = (i + 1 < paths.length) ? i + 1 : 0;
                    }, speed);
                } else {
                    clearInterval(interval);
                    interval = null;
                    el.value = "Lancer la preview";
                }
            }, false);
        };
        this.build_ = function () {
            var speed = parseInt(document.querySelector('#speedInput').value);
            var list = mm.project.rank;
            var sources = [];
            for (var l in list) {
                if (list.hasOwnProperty(l)) {
                    var current = mm.project.getPictureById(list[l]);
                    current.identify();
                    sources.push(current.rootpath + '*');
                }
            }
            var factory = new Factory(null);
            factory.animate(speed, sources);
        };
        /** exit application */
        this.quit_ = function () {
            win.close();
            return process.exit();
        };
        this.getFileNameByPath = function (path) {
            return ('/' === path.slice(-1))
                ? path.split('/').splice(-2, 1)
                : path.split('/').pop();
        };
        this.getParentDir = function (path) {
            return ('/' === path.slice(-1))
                ? path.split('/').slice(0, -2).join('/') + '/'
                : path.split('/').slice(0, -1).join('/') + '/';
        };
        this.cpFileFromDisk = function (from, callback) {
            var fileName = this.getFileNameByPath(from);
            var folder = this.slugify(fileName.replace('_%d', '').split('.')[0]);
            fileName = fileName.replace('_%d', '_0');
            var to = null;
            var that = this;
            fs.exists(this.project.path + folder, function (exist) {
                if (exist) {
                    var nbr = 0;
                    fs.readdirSync(that.project.path).filter(function (el) {
                        if (fs.statSync(path.join(that.project.path, el)).isDirectory() && new RegExp('^(\_([0-9]+))' + folder + '$').test(el)) {
                            nbr++;
                        }
                    });
                    folder = '_' + nbr + folder;
                }
                fs.mkdir(that.project.path + folder, function () {
                    to = that.project.path + folder + '/' + '_0' + fileName;
                    fs.copy(from, to, {replace: false}, function (err) {
                        if (err) throw err;
                        return callback ? callback(to) : true;
                    });
                });
            });
        };
        this.cpFolderContent = function (from, callback) {
            var fileName = this.getFileNameByPath(from);
            var folder = this.slugify(fileName.replace('_%d', '').split('.')[0]);
            var to = null;
            var that = this;
            fs.exists(this.project.path + folder, function (exist) {
                if (exist) {
                    var nbr = 0;
                    fs.readdirSync(that.project.path).filter(function (el) {
                        if (fs.statSync(path.join(that.project.path, el)).isDirectory() && new RegExp('^(\_([0-9]+))' + folder + '$').test(el)) {
                            nbr++;
                        }
                    });
                    folder = '_' + nbr + folder;
                }
                to = that.project.path + folder + '/';
                fs.copyRecursive(that.getParentDir(from), to, function (err) {
                    if (err) throw err;
                    return callback ? callback(to) : true;
                });
            });
        };
        this.cpDuplicate = function (from, missing, callback) {
            var fileName = this.getFileNameByPath(from);
            var folder = this.getFileNameByPath(this.getParentDir(from));
            fileName = fileName.replace('_%d', '_0');
            var to = null;
            var that = this;
            fs.exists(this.project.path + folder, function (exist) {
                if (exist) {
                    var nbr = 0;
                    fileName = fileName.replace('_0', '');
                    fs.readdirSync(that.project.path + folder).filter(function (el) {
                        if (fs.statSync(path.join(that.project.path + folder, el)).isFile() && new RegExp('^(\_([0-9]+))' + fileName + '$').test(el)) {
                            nbr++;
                        }
                    });
                }
                to = that.project.path + folder + '/' + '_' + nbr + fileName;
                fs.copy(from, to, function (err) {
                    if (err) throw err;
                    return callback ? callback(missing - 1) : true;
                });
            });
        };
        /** format string */
        this.slugify = function (str) {
            str = str.replace(/^\s+|\s+$/g, '');
            str = str.toLowerCase();
            var from = "Ã Ã¡Ã¤Ã¢Ã¨Ã©Ã«ÃªÃ¬Ã­Ã¯Ã®Ã²Ã³Ã¶Ã´Ã¹ÃºÃ¼Ã»Ã±Ã§Â·/_,:;";
            var to = "aaaaeeeeiiiioooouuuunc------";
            for (var i = 0, l = from.length; i < l; i++) {
                str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
            }
            str = str
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');

            return str;
        };
        /** Display pretty notifications */
        this.notify = function (text, type, arg, callback) {
            var title =
                ('success' === type) ? 'Bravo'
                    : ('warning' === type) ? 'Attention'
                    : ('error' === type) ? 'Erreur'
                    : ('confirm' === type) ? 'Confirmation'
                    : 'Message';

            if ('confirm' === type) {
                return swal({
                    title: title,
                    text: text,
                    type: 'info',
                    showCancelButton: true,
                    confirmButtonText: "Confirmer",
                    cancelButtonText: "Annuler",
                    closeOnConfirm: true,
                    closeOnCancel: true
                }, function (isConfirm) {
                    if (isConfirm) return callback ? callback(arg) : true;
                });
            }
            return swal(title, text, type);
        };
        /** Check if the type mime is a picture */
        this.isPicture = function (mime) {
            return ["image/gif", "image/jpeg", "image/png"].indexOf(mime) !== -1;
        };
        this.scroll = function (target) {
            return window.scrollTo(0, target.offsetTop);
        };
    };

    /**
     * App object
     * @constructor
     */
    var Project = function (base, name) {
        this.path = base + name + '/';
        this.name = name;
        this.pictures = [];
        this.rank = [];
        this.getPictureById = function (id) {
            var pictures = this.pictures;
            for (var p in pictures) {
                if (pictures.hasOwnProperty(p)) {
                    if (pictures[p].id === id) {
                        return pictures[p];
                    }
                }
            }
            return null;
        };
        this.removePicture = function (id) {
            var pictures = this.pictures;
            for (var i = 0, l = pictures.length; i < l; i++) {
                if (pictures[i].id === id) {
                    this.pictures.splice(i, 1);
                    this.rank.splice(this.rank.indexOf(id), 1);
                    return true;
                }
            }
            return false;
        };
        this.clonePicture = function (picture, path) {
            if (!picture instanceof Picture) throw "picture is null";
            var copy = new Picture(path);
            copy.isExplode = picture.isExplode;
            copy.isBg = picture.isBg;
            copy.nbr = picture.nbr;
            copy.format = picture.format;
            copy.width = picture.width;
            copy.height = picture.height;
            this.pictures.push(copy);
            this.rank.push(copy.id);
            return copy;
        };
    };

    /**
     * @param path
     * @type String path
     * @constructor
     */
    var Picture = function (path) {
        this.id = Math.random().toString(36).substr(2);
        this.rootpath = mm.getParentDir(path);
        this.name = mm.getFileNameByPath(path).replace('_0', '_%d');
        this.path = this.rootpath + this.name;
        this.isExplode = false;
        this.nbr = 1;
        this.width = null;
        this.height = null;
        this.format = null;
        this.isBg = null;
        this.identify = function () {
            var that = this;
            var path = this.getpath();
            im.identify(path, function (err, features) {
                if (err) throw err;
                that.width = features.width;
                that.height = features.height;
                that.format = features.format.toUpperCase();
                that.isBg = that.setBg();
            });
        };
        this.isGif = function () {
            return 'GIF' === this.format;
        };
        this.setBg = function () {
            if (null === this.isBg || 'undefined' === typeof this.isBg) {
                this.isBg = ('GIF' !== this.format && !this.isExplode);
            }
        };
        this.getpath = function (n) {
            n = (null === n || 'undefined' === typeof n) ? 0 : n;
            return this.path.replace('_%d', '_' + n);
        };
    };

    /**
     * @param picture
     * @type Picture picture
     * @constructor
     * Picture handler
     */
    var Factory = function (picture) {
        this.picture = picture;
        this.resize = function (w, h, n, decompose) {
            var that = this;
            n = (null === n || 'undefined' === typeof n) ? 0 : n;
            im.resize({
                srcPath: that.picture.getpath(n),
                dstPath: that.picture.getpath(n),
                width: w + '!',
                height: h + '!'
            }, function (err) {
                if (err) throw err;
                if (n + 1 < that.picture.nbr) return that.resize(w, h, n + 1, decompose);
                else {
                    that.picture.width = w;
                    that.picture.height = h;
                    return decompose ? that.decompose() : true;
                }
            });
        };
        this.decompose = function () {
            var newPath = this.picture.rootpath + this.picture.name.replace('.gif', '.png');
            var that = this;
            im.convert([this.picture.getpath(), '-coalesce', newPath],
                function (err) {
                    if (err) throw err;
                    fs.rmrf(that.picture.getpath(), function (err) {
                        if (err) throw err;
                        var nbr = 0;
                        fs.readdir(picture.rootpath, function (err, items) {
                            if (err) throw err;
                            for (var i = 0; i < items.length; i++) {
                                that.picture.nbr = ++nbr;
                            }
                            that.picture.isExplode = true;
                            that.picture.name = mm.getFileNameByPath(newPath);
                            that.picture.path = newPath;
                            that.picture.format = 'PNG';
                        });
                    });
                });
        };
        this.append = function (transformer, n) {
            n = (null === n || 'undefined' === typeof n) ? 0 : n;
            var bg = transformer.bgList[0];
            var picture = this.picture;
            var width = transformer.width;
            var height = transformer.height;
            var top = transformer.top;
            var left = transformer.left;
            var position = width + '!x' + height + '!+' + left.replace('px', '') + '+' + top.replace('px', '');
            var that = this;
            imc.composite(['-compose', 'Over', '-geometry', position, '-gravity', 'Northwest', picture.getpath(n), bg.getpath(n), bg.getpath(n)],
                function (err) {
                    if (err) throw err;
                    if (n + 1 < bg.nbr) {
                        return that.append(transformer, n + 1);
                    } else {
                        transformer.bgList.shift();
                        if (0 !== transformer.bgList.length) {
                            return that.append(transformer);
                        } else {
                            mm.notify('ok', 'success');
                        }
                    }
                });
        };
        this.animate = function (speed, sources) {
            var args = ['-delay', parseInt(speed / 10), '-loop', 0];
            for (var i = 0, l = sources.length; i < l; i++) {
                args.push(sources[i]);
            }
            args.push(mm._baseOutputPath + mm.slugify(mm.project.name) + '.gif');
            im.convert(args, function (err) {
                if (err) throw err;
                mm.notify('ok', 'success');
            });
        };
    };

    /**
     * @param picture
     * @param bgList
     * @param left
     * @param top
     * @param width
     * @param height
     * @constructor
     */
    var Transformer = function (picture, bgList, left, top, width, height) {
        this.picture = picture;
        this.bgList = bgList;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.tmp = null;
        this.duplicate = function (missing) {
            var that = this;
            mm.cpDuplicate(this.tmp.getpath(), missing, function (missing) {
                that.tmp.nbr++;
                if (missing > 0) {
                    return that.duplicate(missing);
                } else {
                    var img = mm.project.getPictureById(that.tmp.id);
                    img.nbr = that.tmp.nbr;
                    that.tmp = null;
                    return that.fusion();
                }
            });
        };
        this.fusion = function () {
            var bgList = this.bgList;
            var bgS = [];
            var nbrGif = this.picture.nbr;
            var nbrBg = 0;
            for (var b in bgList) {
                if (bgList.hasOwnProperty(b)) {
                    var bg = mm.project.getPictureById(bgList[b]);
                    bgS.push(bg);
                    nbrBg = Math.max(nbrBg, bg.nbr);
                }
            }
            if (nbrBg > nbrGif) {
                this.tmp = this.picture;
                return this.duplicate(nbrBg - nbrGif);
            }
            for (b in bgS) {
                if (bgS.hasOwnProperty(b)) {
                    var current = bgS[b];
                    if (nbrGif > current.nbr) {
                        this.tmp = current;
                        return this.duplicate(nbrBg - current.nbr);
                    }
                }
            }
            this.bgList = bgS;
            var factory = new Factory(this.picture);
            factory.append(this);
        };
    };

    /** Initialisation */
    window.onload = function () {
        mm = new MMGifMaker();
        mm.initialize();
    };
})();
