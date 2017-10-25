/** IMPORT */
const gui = require('nw.gui');
const win = gui.Window.get();
const path = require('path');
const fs = require('fs.extra');
const im = require('imagemagick');
const _ = require('underscore');
const swal = require('sweetalert');
const imc = require('imagemagick-composite');
const slugify = require('underscore.string/slugify');
const messages = require('./message.fr.json');

const baseOutputPath = `${process.env.PWD}/output/`;
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
const updatePreviewPageLink = document.querySelector('#updatePreviewPageLink');
const pictureTable = document.querySelector('#pictureTable');
const fusionContainer = document.querySelector('#fusionContainer');
const pictureFusion = document.querySelector('#pictureFusion');
const previewPicture = document.querySelector('#previewPicture');
let editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
let deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
let usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');

const notify = (text, type) => new Promise((resolve) => {
    let title =
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
        swal({
            title: title,
            text: text,
            type: 'info',
            showCancelButton: true,
            confirmButtonText: messages.button.confirm,
            cancelButtonText: messages.button.cancel,
            closeOnConfirm: true,
            closeOnCancel: true,
        }, (isConfirm) => {
            resolve(isConfirm);
        });
    }

    swal(title, text, type);
    resolve();
});

const scroll = (target) => window.scrollTo(0, target.offsetTop);

const createProject = () => {
    let name = slugify(projectNameInput.value);
    let path = `${baseOutputPath}${name}`;

    fs.exists(path, (exist) => {
        if (exist) {
            notify(messages.error.project_exist, 'error');
            return;
        }

        fs.mkdir(path, () => {
            project = new Project(baseOutputPath, name);
            createButton.className = 'hidden';
            deleteProjectButton.className = '';
            scroll(uploadPage);
            notify(messages.success.ok, 'success');
        });
    });
};

const deleteProject = () => {
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

const dragOver = () => {
    document.querySelector('#uploadPageMessage').innerHTML = messages.drag.over;
    return false;
};

const dragLeave = () => {
    document.querySelector('#uploadPageMessage').innerHTML = messages.drag.leave;
    return false;
};

const isPicture = mime => _.contains(['image/jpeg', 'image/png', 'image/gif'], mime);

const getFileNameByPath = path => ('/' === path.slice(-1))
    ? path.split('/').splice(-2, 1)
    : path.split('/').pop();

const cpFileFromDisk = (from, callback) => {
    let fileName = getFileNameByPath(from);
    let folder = slugify(fileName.replace('_%d', '').split('.')[0]);

    fileName = fileName.replace('_%d', '_0');

    fs.exists(`${project.path}${folder}`, (exist) => {
        if (exist) {
            let nbr = 0;

            fs.readdirSync(project.path).filter((el) => {
                if (
                    fs.statSync(path.join(project.path, el)).isDirectory()
                    && new RegExp(`^(_([0-9]+))${folder}$`).test(el)
                ) {
                    nbr += 1;
                }
            });

            folder = `_${nbr}${folder}`;
        }

        fs.mkdir(`${project.path}${folder}`, () => {
            const to = `${project.path}${folder}/_0${fileName}`;

            fs.copy(from, to, { replace: false }, (err) => {
                if (err) {
                    notify(err.toString(), 'error');
                    return;
                }

                callback ? callback(to) : true;
            });
        });
    });
};

const upload = (event) => {
    event.preventDefault();

    const element = event.target;
    const files = ('undefined' !== typeof event.dataTransfer) ? event.dataTransfer.files : element.files;

    _.each(files, (file) => {
        if (isPicture(file['type'])) {
            cpFileFromDisk(file.path, (path) => {
                const picture = new Picture(path);
                picture.identify();
                project.pictures.push(picture);
                project.rank.push(picture.id);
                notify(messages.success.ok, 'success');
            });
        }
        else {
            notify(messages.error.type_mime, 'error');
        }
    });

    uploadFileButton.value = null;
};

const dynamicEvent = () => {
    editPictureCollectionLink = document.querySelectorAll('.editPictureCollectionLink');
    deletePictureCollectionLink = document.querySelectorAll('.deletePictureCollectionLink');
    usePictureCollectionLink = document.querySelectorAll('.usePictureCollectionLink');

    for (let i = 0, l = editPictureCollectionLink.length; i < l; i++) {
        editPictureCollectionLink[i].addEventListener('click', loadEditPicture, false);
        deletePictureCollectionLink[i].addEventListener('click', loadDeletePicture, false);
        usePictureCollectionLink[i].addEventListener('click', usePicture, false);
    }

    let sortable = new Sortable(pictureTable, {
        handle: '.sortable',
        animation: 150,
        onUpdate: () => {
            const row = document.querySelectorAll('.pictureEditRow');
            project.rank = [];
            _.each(row, r => project.rank.push(r.getAttribute('data-image')));
        },
    });
};

const loadPicture = () => {
    if (null === project) {
        return notify(messages.error.unknown_project, 'warning');
    }

    pictureTable.innerHTML = '';

    if (_.isEmpty(project.pictures)) {
        return notify(messages.error.any_picture, 'warning');
    }

    const template = document.querySelector('#pictureTemplate').innerHTML;
    const ranks = project.rank;

    _.each(ranks, (rank) => {
        const picture = project.getPictureById(rank);
        picture.setBg();
        pictureTable.innerHTML +=
            template
                .replace('%src%', 'output/' + path.relative(baseOutputPath, `${picture.getPath()}?d=${Date.now()}`))
                .replace('%info%', `${picture.nbr} images`)
                .replace(new RegExp('%data%', 'g'), picture.id);
    });

    dynamicEvent();
};

const loadEditPicture = (event) => {
    document.querySelector('#jpg').className = 'hidden';
    document.querySelector('#gif').className = 'hidden';

    const element = event.currentTarget;
    const id = element.getAttribute('data-image');
    const picture = project.getPictureById(id);

    pictureIdHidden.value = id;
    editWidthInput.value = picture.width;
    editHeightInput.value = picture.height;

    switch (picture.format) {
    case 'JPG':
    case 'JPEG':
    case 'PNG':
        if (!picture.isExplode) {
            document.querySelector('#jpg').className = '';
            useAtBgCheckbox.checked = !picture.isBg ? true : picture.isBg;
        }
        break;
    case 'GIF':
        document.querySelector('#gif').className = '';
        explodeGifCheckbox.checked = picture.isExplode;

        if (picture.isExplode) {
            explodeGifCheckbox.setAttribute('disabled', 'disabled');
        } else {
            explodeGifCheckbox.removeAttribute('disabled');
        }
        break;
    }

    scroll(document.querySelector('#editPage'));
};

const loadDeletePicture = (event) => {
    const element = event.currentTarget;
    const picture = project.getPictureById(element.getAttribute('data-image'));

    notify(messages.confirm_remove, 'confirm')
        .then((isConfirm) => {
            if (isConfirm) {
                fs.rmrf(picture.rootpath, (err) => {
                    if (err) {
                        notify(err.toString(), 'error');
                        return;
                    }

                    project.removePicture(picture.id);
                    loadPicture();
                    notify(messages.success.remove_picture, 'success');
                });
            }
        }).catch(err => notify(err.toString(), 'error'));
};

const usePicture = (event) => {
    loadFusionButton.className = 'hidden';
    document.querySelector('#containerUseBackground').innerHTML = '';

    const element = event.currentTarget;
    const id = element.getAttribute('data-image');
    const picture = project.getPictureById(id);
    const parent = fusionButton.parentNode;

    parent.className = 'hidden';
    duplicateButton.setAttribute('data-use', id);

    if (!picture.isBg) {
        if (picture.isGif() && !picture.isExplode) {
            notify(messages.error.gif_decompose, 'warning');
        } else {
            fusionButton.setAttribute('data-use', id);
            parent.className = '';
        }
    }

    scroll(document.querySelector('#usePicturePage'));
};

const editPicture = () => {
    const message = [];
    const picture = project.getPictureById(pictureIdHidden.value);
    const factory = new Factory(picture);
    const decompose = picture.isGif() && explodeGifCheckbox.checked && !picture.isExplode;
    let useCallback = false;

    if (!picture.isGif() && !picture.isExplode) {
        picture.isBg = useAtBgCheckbox.checked;
        const str = (picture.isBg) ? messages.text.picture_bg : messages.text.picture_not_bg;
        message.push(str);
    }

    if (
        editWidthInput.value !== picture.width
        || editHeightInput.value !== picture.height
    ) {
        useCallback = decompose;

        if (useCallback) {
            factory.resize(editWidthInput.value, editHeightInput.value, 0);
        }
        else {
            factory.resize(editWidthInput.value, editHeightInput.value);
        }

        if (picture.isBg) {
            const others = project.pictures;

            _.each(others, (other) => {
                if (other.isBg && other.id !== picture.id) {
                    let f = new Factory(other);
                    f.resize(editWidthInput.value, editHeightInput.value);
                }
            });

            message.push(messages.success.bg_resize);
        }
        else {
            message.push(messages.success.picture_resize);
        }
    }
    if (decompose) {
        explodeGifCheckbox.setAttribute('disabled', 'disabled');
        message.push(messages.success.gif_decompose);

        if (!useCallback) {
            factory.decompose();
        }
    }

    if (0 !== message.length) {
        notify(message.join('\n'), 'success');
    }
};

const ratio = (event) => {
    if (event.currentTarget.checked) {
        let picture = project.getPictureById(pictureIdHidden.value);
        editWidthInput.value = picture.width;
        editHeightInput.value = picture.height;
    }
};

const size = (event) => {
    if (!ratioCheckbox.checked) {
        return false;
    }

    const element = event.currentTarget;
    const picture = project.getPictureById(pictureIdHidden.value);

    if (element.getAttribute('id') === editWidthInput.getAttribute('id')) {
        return editHeightInput.value = Math.round((picture.height / picture.width) * editWidthInput.value);
    } else if (element.getAttribute('id') === editHeightInput.getAttribute('id')) {
        return editWidthInput.value = Math.round((picture.width / picture.height) * editHeightInput.value);
    }
};

const duplicate = (event) => {
    const picture = project.getPictureById(event.currentTarget.getAttribute('data-use'));

    cpFolderContent(picture.path, (to) => {
        project.clonePicture(picture, to + picture.name);
        notify(messages.success.ok, 'success');
    });
};

const prepareFusionLoad = (event) => {
    const picture = project.getPictureById(event.currentTarget.getAttribute('data-use'));
    const container = document.querySelector('#containerUseBackground');

    container.innerHTML = '';

    const template = document.querySelector('#backgroundTemplate').innerHTML;
    const pictures = project.pictures;

    let hidden = 'hidden';

    _.each(pictures, (picture) => {
        hidden = '';
        container.innerHTML +=
            template
                .replace('%src%', 'output/' + path.relative(baseOutputPath, picture.getPath() + '?d=' + Date.now()))
                .replace('%id%', picture.id);
    });

    if ('hidden' === hidden) {
        container.innerHTML = messages.error.any_bg;
    } else {
        loadFusionButton.setAttribute('data-use', picture.id);
    }

    loadFusionButton.className = hidden;
};

const fusionLoad = (event) => {
    const element = event.currentTarget;
    const bgList = document.querySelectorAll('.bgList:checked');
    const picture = project.getPictureById(element.getAttribute('data-use'));
    const bgListId = [];

    if (0 === bgList.length) {
        notify(messages.error.any_bg_selected, 'error');
        return;
    }

    _.each(bgList, b => bgListId.push(b.getAttribute('data-bg')));

    const bgForWork = project.getPictureById(bgListId[0]);

    fusionContainer.style.width = bgForWork.width + 'px';
    fusionContainer.style.height = bgForWork.height + 'px';
    // eslint-disable-next-line max-len
    fusionContainer.style.background = 'url(%s) center center no-repeat'.replace('%s', 'output/' + path.relative(baseOutputPath, bgForWork.getPath() + '?d=' + Date.now()));

    pictureFusion.style.width = picture.width;
    pictureFusion.style.height = picture.height;
    pictureFusion.src = 'output/' + path.relative(baseOutputPath, picture.getPath() + '?d=' + Date.now());
    pictureFusion.style.left = '10px';
    pictureFusion.style.top = '10px';

    fusionContainer.setAttribute('data-picture', picture.id);
    fusionContainer.setAttribute('data-picture', picture.id);
    fusionContainer.setAttribute('data-bg', bgListId.join(','));

    scroll(document.querySelector('#fusionPage'));
};

const moveDrag = (event) => {
    const element = event.target;
    const offsetX = parseInt(element.getAttribute('data-offset-x'));
    const offsetY = parseInt(element.getAttribute('data-offset-y'));
    const coordX = parseInt(element.getAttribute('data-coord-x'));
    const coordY = parseInt(element.getAttribute('data-coord-y'));

    switch (element.getAttribute('data-action')) {
    case 'drag':
        element.style.left = coordX + event.clientX - offsetX + 'px';
        element.style.top = coordY + event.clientY - offsetY + 'px';
        break;
    case 'resize':
        // eslint-disable-next-line max-len
        pictureFusion.style.width = (parseInt(element.getAttribute('data-start-width')) + event.clientX - offsetX) + 'px';
        // eslint-disable-next-line max-len
        pictureFusion.style.height = (parseInt(element.getAttribute('data-start-height')) + event.clientY - offsetY) + 'px';
        break;
    default:
        break;
    }
};

const startDrag = (event) => {
    event.preventDefault();

    const element = event.currentTarget;
    const offsetX = event.clientX;
    const offsetY = event.clientY;

    switch (element.className) {
    case 'drag':
        if (!element.style.left) {
            element.style.left = '10px';
        }

        if (!element.style.top) {
            element.style.top = '10px';
        }
        pictureFusion.setAttribute('data-coord-x', element.style.left.toString());
        pictureFusion.setAttribute('data-coord-y', element.style.top.toString());
        pictureFusion.setAttribute('data-offset-x', offsetX.toString());
        pictureFusion.setAttribute('data-offset-y', offsetY.toString());
        pictureFusion.setAttribute('data-action', 'drag');
        fusionContainer.addEventListener('mousemove', moveDrag, false);
        break;
    case 'resize':
        pictureFusion.setAttribute('data-offset-x', offsetX.toString());
        pictureFusion.setAttribute('data-offset-y', offsetY.toString());
        // eslint-disable-next-line max-len
        pictureFusion.setAttribute('data-start-width', parseInt(document.defaultView.getComputedStyle(pictureFusion, null).width, 10).toString());
        // eslint-disable-next-line max-len
        pictureFusion.setAttribute('data-start-height', parseInt(document.defaultView.getComputedStyle(pictureFusion, null).height, 10).toString());
        pictureFusion.setAttribute('data-action', 'resize');
        fusionContainer.addEventListener('mousemove', moveDrag, false);
        break;
    default:
        break;
    }
};

const stopDrag = () => {
    pictureFusion.setAttribute('data-coord-x', pictureFusion.style.left.toString());
    pictureFusion.setAttribute('data-coord-y', pictureFusion.style.top.toString());
    pictureFusion.setAttribute('data-action', '');
};

const toogleDragResize = (event) => {
    const element = event.currentTarget;
    element.className = 'drag' === element.className ? 'resize' : 'drag';
};

const makeFusion = () => {
    const picture = project.getPictureById(fusionContainer.getAttribute('data-picture'));
    const bgList = fusionContainer.getAttribute('data-bg').split(',');
    const left = pictureFusion.style.left;
    const top = pictureFusion.style.top;
    const width = pictureFusion.offsetWidth;
    const height = pictureFusion.offsetHeight;
    const transformer = new Transformer(picture, bgList, left, top, width, height);

    transformer.fusion();
};

const calculateAspectRatio = (srcWidth, srcHeight, maxWidth, maxHeight, r) => {
    let ratio = r;

    ratio = (null === ratio || 'undefined' === typeof ratio) ?
        Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
        : ratio;

    return { width: srcWidth * ratio, height: srcHeight * ratio, ratio: ratio };
};

const loadPreview = () => {
    const paths = [];
    const date = Date.now();
    const list = project.rank;
    let dimension = null;
    let interval = null;

    _.each(list, (l) => {
        const current = project.getPictureById(l);

        for (let i = 0; i < current.nbr; i++) {
            paths.push('output/' + path.relative(baseOutputPath, current.getPath(i) + '?d=' + date));

            if (current.isBg && null === dimension) {
                dimension = calculateAspectRatio(current.width, current.height, 800, 700);
            }
        }
    });

    previewPicture.setAttribute('src', paths[0]);
    previewPicture.style.width = dimension.width;
    previewPicture.style.height = dimension.height;

    document.querySelector('#previewButton').addEventListener('click', (e) => {
        const element = e.currentTarget;

        if (null === interval) {
            const speed = parseInt(document.querySelector('#speedInput').value);
            let i = 0;

            element.value = 'Stopper la preview';

            interval = setInterval(() => {
                previewPicture.setAttribute('src', paths[i]);
                i = (i + 1 < paths.length) ? i + 1 : 0;
            }, speed);

        } else {
            clearInterval(interval);
            interval = null;
            element.value = 'Lancer la preview';
        }
    }, false);
};

const build = () => {
    const speed = parseInt(document.querySelector('#speedInput').value);
    const list = project.rank;
    const sources = [];

    _.each(list, (l) => {
        const current = project.getPictureById(l);
        current.identify();
        sources.push(current.rootpath + '*');
    });

    const factory = new Factory(null);
    factory.animate(speed, sources);
};

const quit = () => {
    win.close();
    return process.exit();
};

const getParentDir = path => ('/' === path.slice(-1))
    ? path.split('/').slice(0, -2).join('/') + '/'
    : path.split('/').slice(0, -1).join('/') + '/';

const cpFolderContent = (from, callback) => {
    const fileName = getFileNameByPath(from);
    let folder = slugify(fileName.replace('_%d', '').split('.')[0]);
    let that = this;

    fs.exists(project.path + folder, (exist) => {
        if (exist) {
            let nbr = 0;

            fs.readdirSync(project.path).filter((el) => {
                if (
                    fs.statSync(path.join(project.path, el)).isDirectory()
                    && new RegExp('^(_([0-9]+))' + folder + '$').test(el)
                ) {
                    nbr += 1;
                }
            });

            folder = `_${nbr}${folder}`;
        }

        const to = project.path + folder + '/';

        fs.copyRecursive(that.getParentDir(from), to, (err) => {
            if (err) {
                notify(err.toString(), 'error');
                return;
            }

            return callback ? callback(to) : true;
        });
    });
};

const cpDuplicate = (from, missing, callback) => {
    const folder = getFileNameByPath(getParentDir(from));
    let fileName = getFileNameByPath(from);
    let nbr = 0;

    fileName = fileName.replace('_%d', '_0');

    fs.exists(project.path + folder, (exist) => {
        if (exist) {
            fileName = fileName.replace('_0', '');

            fs.readdirSync(project.path + folder).filter((el) => {
                if (
                    fs.statSync(path.join(project.path + folder, el)).isFile()
                    && new RegExp('^(_([0-9]+))' + fileName + '$').test(el)
                ) {
                    nbr += 1;
                }
            });
        }

        const to = `${project.path}${folder}/_${nbr}${fileName}`;

        fs.copy(from, to, function (err) {
            if (err) {
                notify(err.toString(), 'error');
                return;
            }

            return callback ? callback(missing - 1) : true;
        });
    });
};

const makeId = () => Math.random().toString(36).substr(2);

class Project {
    constructor(base, name) {
        this.path = base + name + '/';
        this.name = name;
        this.pictures = [];
        this.rank = [];
    }

    getPictureById(id) {
        return _.findWhere(this.pictures, { id });
    }

    removePicture(id) {
        const pictures = this.pictures;

        for (let i = 0, l = pictures.length; i < l; i++) {
            if (pictures[i].id === id) {
                this.pictures.splice(i, 1);
                this.rank.splice(this.rank.indexOf(id), 1);

                return true;
            }
        }

        return false;
    }

    clonePicture(picture) {
        if (!(picture instanceof Picture)) {
            throw 'picture is null';
        }

        const copy = _.clone(picture);
        copy.id = makeId();

        this.pictures.push(copy);
        this.rank.push(copy.id);

        return copy;
    }
}

class Picture {
    constructor(path) {
        this.id = makeId();
        this.rootpath = getParentDir(path);
        this.name = getFileNameByPath(path).replace('_0', '_%d');
        this.path = this.rootpath + this.name;
        this.isExplode = false;
        this.nbr = 1;
        this.width = null;
        this.height = null;
        this.format = null;
        this.isBg = null;
    }

    identify() {
        const path = this.getPath();

        im.identify(path, (err, features) => {
            if (err) {
                throw err;
            }

            this.width = features.width;
            this.height = features.height;
            this.format = features.format.toUpperCase();
            this.isBg = this.setBg();
        });
    }

    isGif() {
        return 'GIF' === this.format;
    }

    setBg() {
        if (null === this.isBg || 'undefined' === typeof this.isBg) {
            this.isBg = ('GIF' !== this.format && !this.isExplode);
        }
    }

    getPath(z) {
        let n = z;
        n = (null === n || 'undefined' === typeof n) ? 0 : n;

        return this.path.replace('_%d', '_' + n);
    }
}

class Factory {
    constructor(picture) {
        this.picture = picture;
    }

    resize(w, h, z, decompose) {
        let n = z;

        n = (null === n || 'undefined' === typeof n) ? 0 : n;

        im.resize({
            srcPath: this.picture.getPath(n),
            dstPath: this.picture.getPath(n),
            width: w + '!',
            height: h + '!',
        }, (err) => {
            if (err) {
                throw err;
            }

            if (n + 1 < this.picture.nbr) {
                return this.resize(w, h, n + 1, decompose);
            }

            this.picture.width = w;
            this.picture.height = h;

            return decompose ? this.decompose() : true;
        });
    }

    decompose() {
        let newPath = this.picture.rootpath + this.picture.name.replace('.gif', '.png');

        im.convert([this.picture.getPath(), '-coalesce', newPath],
            (err) => {
                if (err) {
                    throw err;
                }

                fs.rmrf(this.picture.getPath(), (err) => {
                    if (err) {
                        throw err;
                    }

                    let nbr = 0;

                    fs.readdir(this.picture.rootpath, (err, items) => {
                        if (err) {
                            throw err;
                        }

                        for (let i = 0; i < items.length; i++) {
                            // eslint-disable-next-line no-plusplus
                            this.picture.nbr = ++nbr;
                        }

                        this.picture.isExplode = true;
                        this.picture.name = getFileNameByPath(newPath);
                        this.picture.path = newPath;
                        this.picture.format = 'PNG';
                    });
                });
            });
    }

    append(transformer, z) {
        let n = z;

        n = (null === n || 'undefined' === typeof n) ? 0 : n;

        const bg = transformer.bgList[0];
        const picture = this.picture;
        const width = transformer.width;
        const height = transformer.height;
        const top = transformer.top;
        const left = transformer.left;
        const position = `${width}!x${height}!+${left.replace('px', '')}+${top.replace('px', '')}`;

        imc.composite(
            [
                '-compose',
                'Over',
                '-geometry',
                position,
                '-gravity',
                'Northwest',
                picture.getPath(n),
                bg.getPath(n),
                bg.getPath(n),
            ],
            (err) => {
                if (err) {
                    throw err;
                }

                if (n + 1 < bg.nbr) {
                    return this.append(transformer, n + 1);
                }

                transformer.bgList.shift();

                if (0 !== transformer.bgList.length) {
                    return this.append(transformer);
                }

                notify(messages.success.ok, 'success');
            });
    }

    animate(speed, sources) {
        const args = ['-delay', parseInt(speed / 10), '-loop', 0];

        _.each(sources, s => args.push(s));

        args.push(`${baseOutputPath}${slugify(project.name)}.gif`);

        im.convert(args, (err) => {
            if (err) {
                throw err;
            }

            notify(messages.success.ok, 'success');
        });
    }
}

class Transformer {
    constructor(picture, bgList, left, top, width, height) {
        this.picture = picture;
        this.bgList = bgList;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.tmp = null;
    }

    duplicate(missing) {
        cpDuplicate(this.tmp.getPath(), missing, (m) => {
            this.tmp.nbr += 1;

            if (0 < m) {
                return this.duplicate(m);
            }

            let img = project.getPictureById(this.tmp.id);
            img.nbr = this.tmp.nbr;
            this.tmp = null;

            return this.fusion();
        });
    }

    fusion() {
        const bgList = this.bgList;
        const bgS = [];
        const nbrGif = this.picture.nbr;
        let nbrBg = 0;

        _.each(bgList, (b) => {
            const bg = project.getPictureById(b);
            bgS.push(bg);
            nbrBg = Math.max(nbrBg, bg.nbr);
        });

        if (nbrBg > nbrGif) {
            this.tmp = this.picture;
            return this.duplicate(nbrBg - nbrGif);
        }

        _.each(bgS, (b) => {
            if (nbrGif > b.nbr) {
                this.tmp = b;
                return this.duplicate(nbrBg - b.nbr);
            }
        });

        this.bgList = bgS;
        const factory = new Factory(this.picture);

        factory.append(this);
    }
}

createButton.addEventListener('click', createProject, false);
deleteProjectButton.addEventListener('click', deleteProject, false);
updatePicturePageLink.addEventListener('click', loadPicture, false);
updatePreviewPageLink.addEventListener('click', loadPreview, false);
submitEditButton.addEventListener('click', editPicture, false);
duplicateButton.addEventListener('click', duplicate, false);
fusionButton.addEventListener('click', prepareFusionLoad, false);
loadFusionButton.addEventListener('click', fusionLoad, false);
makeFusionButton.addEventListener('click', makeFusion, false);
ratioCheckbox.addEventListener('click', ratio, false);
editHeightInput.addEventListener('blur', size, false);
editWidthInput.addEventListener('blur', size, false);
uploadPage.addEventListener('drop', upload, false);
uploadFileButton.addEventListener('change', upload, false);
uploadPage.addEventListener('dragover', dragOver, false);
uploadPage.addEventListener('dragleave', dragLeave, false);
pictureFusion.addEventListener('mousedown', startDrag, false);
fusionContainer.addEventListener('mouseup', stopDrag, false);
pictureFusion.addEventListener('dblclick', toogleDragResize, false);
quitLink.addEventListener('click', quit, false);

window.ondragover = window.ondrop = function (e) {
    e.preventDefault();
    return false;
};

document.querySelector('#buildButton').addEventListener('click', build, false);
