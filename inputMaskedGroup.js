/**
 * v 1.0.0
 */
(function($) {
    $.fn.getCursorPosition = function() {
        try {
            var input = this.get(0);
            if (!input) return; // No (input) element found
            if ('selectionStart' in input) {
                // Standard-compliant browsers
                return input.selectionStart;
            } else if (document.selection) {
                // IE
                input.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                sel.moveStart('character', -input.value.length);
                return sel.text.length - selLen;
            }
        } catch (e){
            return null;
        }

    };
    $.fn.setCursorPosition = function(pos) {
        try {
            var el = $(this).get(0);
            if (el.setSelectionRange) {
                el.setSelectionRange(pos, pos);
            } else if (el.createTextRange) {
                var range = el.createTextRange();
                range.collapse(true);
                if(pos < 0) {
                    pos = $(this).val().length + pos;
                }
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        } catch (e){
            return false;
        }
    }
})(jQuery);

(function($){

    $.fn.inputGroup = function(){
        var elements = $(this);
        elements.each(function(index,item){
            var $this = $(item);
            if ($this.data('inputGroup_processed')) return;

            var size = $(item).attr('maxlength');
            if (!size) {
                console.error(item);
                throw 'attribute "maxlength" not provided at group input';
            }

            var next = elements[index+1];
            var prev = elements[index-1];
            $this.on('input.inputGroup',function(e){
                var cursorPos = $this.getCursorPosition();
                var isCursorOnEndPos = cursorPos==$this.val().length;
                if ($this.val().length>size) {
                    $this.val($this.val().substr(0,size));
                }
                if ((cursorPos===null || isCursorOnEndPos) && $this.val().length==size) {
                    next && $(next).focus();
                }
            });
            $this.on('keyup.inputGroup',function(e){
                var cursorPos = $this.getCursorPosition();
                var isCursorOnEndPos = cursorPos==$this.val().length;

                if ((e.keyCode==8) && !$this.data('lastVal')) { // backspace or left
                    prev && $(prev).focus();
                }

                if (e.keyCode==39) { // right
                    if ((cursorPos===null || isCursorOnEndPos)) {
                        next && $(next).focus();
                    }
                }

                if (e.keyCode==37) { // left
                    if ((cursorPos===0 || $this.val().length==0)) {
                        prev && $(prev).focus();
                    }
                }

                $this.data('lastVal',$this.val());
            });
            $this.data('inputGroup_processed','1');
        });
    };


    $.fn.inputUngroup = function(){
        $(this).off('keyup.inputGroup input.inputGroup');
    };



})(jQuery);

(function($){

    var defaultTranslations = {
        '9':/[0-9]/
    };

    var testTranslation = function(compiledPattern,patternTester,value){
        if (patternTester instanceof RegExp) return patternTester.test(value);
        else if (typeof patternTester === 'string' || typeof patternTester === 'number') return patternTester===value;
        else if (patternTester.call) {
            var args = [];
            compiledPattern.arr.forEach(function(p){
                if (p.type=='special') {
                    args.push(p.userValue);
                }
            });
            var result = patternTester(args);
            if (result==undefined) throw "pattern function must return one of value supported";
            return testTranslation(
                compiledPattern,
                result,
                value
            );
        }
        else {
            console.error(patternTester);
            throw (typeof patternTester) + ' type not supported in translation object';
        }
    };

    var compilePattern = function(pattern,translations){
        var compiled = {arr:[],translations:translations};
        var translationKeys = Object.keys(translations);
        pattern.split('').forEach(function(char){
            compiled.arr.push({
                type:translationKeys.indexOf(char)>-1?'special':'raw',
                value:char
            });
        });
        return compiled;
    };


    var setValueByPattern = function(value,compiledPattern){
        var valIndex = 0;
        var patternIndex = 0;
        var length = value.length;
        var result = '';
        if (value.length==1) {
            var firstSpecialPatternName = compiledPattern.arr.filter(function(p){return p.type=='special'})[0];
            var ptrn = compiledPattern.translations[firstSpecialPatternName.value];
            if (
                ptrn &&
                !testTranslation(compiledPattern,ptrn,value)
            ) return '';
        }
        while (valIndex<length){
            var patternItem = compiledPattern.arr[patternIndex];
            if (!patternItem) break;
            if (value[valIndex]==undefined) break;
            if (patternItem.type=='special') {
                if (testTranslation(
                        compiledPattern,
                        compiledPattern.translations[patternItem.value],
                        value[valIndex])
                ) {
                    result+=value[valIndex];
                    patternItem.userValue = value[valIndex];
                    patternIndex++;
                }
                valIndex++;
            } else {
                if (patternItem.value==value[valIndex]) {
                    result+=patternItem.value;
                    valIndex++;
                    patternIndex++;
                } else {
                    result+=patternItem.value;
                    patternIndex++;
                }

            }
        }
        return result;
    };

    var rawValue = function(val,compiledPattern){
        var res = '';
        compiledPattern.arr.forEach(function(patternItem,index){
            if (patternItem.type=='special'){
                if (val[index]) res+=patternItem.userValue;
            }
        });
        return res;
    };

    $.fn.inputMask = function(maskPattern,maskTranslations){
        if (!maskTranslations) maskTranslations = {};
        $.extend(maskTranslations,defaultTranslations);
        var elements = $(this);
        maskPattern = compilePattern(maskPattern,maskTranslations);
        elements.each(function(index,item){
            var $this = $(item);
            if ($this.data('inputMask_processed')) return;

            if (!$this.attr('maxlength')) {
                $this.attr('maxlength',maskPattern.arr.length);
            }

            $this.on('input.inputMask',function(e){
                var caretPos = $this.getCursorPosition();
                if (caretPos==$this.val().length) caretPos = -1;
                var newVal = setValueByPattern(
                    $this.val(),
                    maskPattern
                );

                $this.val(newVal);
                if (caretPos!=-1) $this.setCursorPosition(caretPos);
                else {
                    // to fix android cursor bug
                    var size = $this.attr('maxlength');
                    if (size && size==newVal.length) return;
                    setTimeout(function(){
                        var v = $this.val();
                        $this.val('');
                        $this.val(v).trigger('change');
                        $this.focus();
                    },1);
                }
            });
            $this.data('inputMask_processed','1');
        });
    };

    $.fn.inputUnmask = function(){
        $(this).off('input.inputMask');
    }

})(jQuery);
