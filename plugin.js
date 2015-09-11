(function() {
    'use strict';

    CKEDITOR.config.exselectionFocusRetryCount = 200;

    CKEDITOR.config.exselectionFocusRetryDelay = 10;

    CKEDITOR.tools.extend(CKEDITOR.editor.prototype, {
        /**
         * Установка фокуса с повторением
         * @param {function} [callback] проверка необходимости повторной попытки
         */
        retryFocus: function(callback) {
            if (typeof(callback) !== 'function') {
                callback = function() { return true; };
            }

            var that = this;
            var retry = 0;
            var retryCount = this.config.exselectionFocusRetryCount;
            var retryDelay = this.config.exselectionFocusRetryDelay;

            var _retryFocus = function() {
                if (retry > retryCount ||
                    that.status !== 'ready' ||
                    that.readOnly ||
                    !callback()) {

                    return;
                }

                var editable = that.editable();
                if (editable.hasFocus) {
                    return;
                }

                retry++;
                that.focus();

                if (!editable.hasFocus) {
                    window.setTimeout(_retryFocus, retryDelay);
                }
            };

            _retryFocus();
        },

        selectionToStart: function() {
            if (this.readOnly ||
                this.status !== 'ready') {

                return;
            }

            if (this.mode === 'source') {
                setSelection(this.editable().$, 0);

            } else if (this.mode === 'wysiwyg') {
                var range = this.createRange();
                range.moveToElementEditStart(range.root);
                this.getSelection().selectRanges([ range ]);
            }
        }

        selectionToEnd: function() {
            if (this.readOnly ||
                this.status !== 'ready') {

                return;
            }

            if (this.mode === 'source') {
                setSelection(this.editable().$, (this.getData() || '').length);

            } else if (this.mode === 'wysiwyg') {
                var range = this.createRange();
                range.moveToElementEditEnd(range.root);
                this.getSelection().selectRanges([ range ]);
            }
        },

        pasteContent: function(content, breakAfter, mode) {
            if (this.readOnly ||
                this.status !== 'ready') {

                return;
            }

            if (this.mode === 'source') {
                var position = content.length;
                content += (breakAfter ? '\n' : '') + this.getData();
                this.setData(content);
                setSelection(this.editable().$, position);

            } else if (this.mode === 'wysiwyg' && (!this.undoManager || !this.undoManager.locked)) {
                var selection = this.getSelection();
                var range = selection && selection.getRanges()[ 0 ];

                if (range) {
                    var element = new CKEDITOR.dom.element(breakAfter ? 'br' : 'span');
                    this.insertElement(element);
                    range.moveToPosition(element, CKEDITOR.POSITION_BEFORE_START);

                    this.insertHtml(content, mode || 'html', range);
                    this.fire('updateSnapshot');
                }
            }
        }

    }, true);

    CKEDITOR.plugins.add('exselection', {
        modes: { 'wysiwyg': 1, 'source': 1 },
        init: function() {}
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
