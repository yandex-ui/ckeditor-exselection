(function() {
    'use strict';

    CKEDITOR.config.exselectionFocusRetryCount = 200;

    CKEDITOR.config.exselectionFocusRetryDelay = 10;

    CKEDITOR.plugins.add('exselection', {
        modes: { 'wysiwyg': 1, 'source': 1 },
        init: function(editor) {

            /**
             * Установка фокуса с повторением
             * @param {function} [callback] проверка необходимости повторной попытки
             */
            editor.addCommand('retryFocus', {
                'modes': { 'wysiwyg': 1, 'source': 1 },
                'editorFocus': false,
                'canUndo': false,
                'exec': this._retryFocus
            });

            editor.addCommand('selectionToStart', {
                'modes': { 'wysiwyg': 1, 'source': 1 },
                'editorFocus': false,
                'canUndo': false,
                'exec': this._selectionToStart
            });

            editor.addCommand('selectionToEnd', {
                'modes': { 'wysiwyg': 1, 'source': 1 },
                'editorFocus': false,
                'canUndo': false,
                'exec': this._selectionToEnd
            });

            editor.addCommand('pasteContent', {
                'modes': { 'wysiwyg': 1, 'source': 1 },
                'editorFocus': false,
                'canUndo': false,
                'exec': this._pasteContent
            });
        },

        _pasteContent: function(editor, data) {
            if (editor.readOnly ||
                editor.status !== 'ready') {

                return;
            }

            if (editor.mode === 'source') {
                var position = data.content.length;
                data.content += (data.breakAfter ? '\n' : '') + editor.getData();
                editor.setData(data.content);
                setSelection(editor.editable().$, position);

            } else if (editor.mode === 'wysiwyg' && (!editor.undoManager || !editor.undoManager.locked)) {
                var selection = editor.getSelection();
                var range = selection && selection.getRanges()[ 0 ];

                if (range) {
                    var element = new CKEDITOR.dom.element(data.breakAfter ? 'br' : 'span');
                    editor.insertElement(element);
                    range.moveToPosition(element, CKEDITOR.POSITION_BEFORE_START);

                    editor.insertHtml(data.content, data.mode || 'html', range);
                    editor.fire('updateSnapshot');
                }
            }
        },

        _selectionToEnd: function(editor) {
            if (editor.readOnly ||
                editor.status !== 'ready') {

                return;
            }

            if (editor.mode === 'source') {
                setSelection(editor.editable().$, (editor.getData() || '').length);

            } else if (editor.mode === 'wysiwyg') {
                var range = editor.createRange();
                range.moveToElementEditEnd(range.root);
                editor.getSelection().selectRanges([ range ]);
            }
        },

        _selectionToStart: function(editor) {
            if (editor.readOnly ||
                editor.status !== 'ready') {

                return;
            }

            if (editor.mode === 'source') {
                setSelection(editor.editable().$, 0);

            } else if (editor.mode === 'wysiwyg') {
                var range = editor.createRange();
                range.moveToElementEditStart(range.root);
                editor.getSelection().selectRanges([ range ]);
            }
        },

        _retryFocus: function(editor, callback) {
            if (typeof(callback) !== 'function') {
                callback = function() { return true; };
            }

            var retry = 0;
            var retryCount = editor.config.exselectionFocusRetryCount;
            var retryDelay = editor.config.exselectionFocusRetryDelay;

            var _retryFocus = function() {
                if (retry > retryCount ||
                    editor.status !== 'ready' ||
                    editor.readOnly ||
                    !callback()) {

                    return;
                }

                var editable = editor.editable();
                if (editable.hasFocus) {
                    return;
                }

                retry++;
                editor.focus();

                if (!editable.hasFocus) {
                    window.setTimeout(_retryFocus, retryDelay);
                }
            };

            _retryFocus();
        }
    });

    function setSelection(field, start, end) {
        start = start || 0;
        end = end || start;

        if (field.setSelectionRange) {
            field.setSelectionRange(start, end);

        } else if (field.createTextRange) {
            var range = field.createTextRange();
            range.collapse(true);
            range.moveStart('character', start);
            range.moveEnd('character', end - start);
            range.select();
        }
    }

}());
