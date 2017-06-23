jQuery mask and group input plugin with android support

* jQuery based
* simple to use
* support input with type "number","tel" etc
* compatible with android platform browsers 

```html
    
    <input type="text" class="group card">
    
    <input type="number" class="group date">
    
    <input type="number" class="group month">
    
    <input type="tel" class="group tel">
```    


```javascript

    $('.card').inputMask('9999 9999 9999 9999'); // "9" means any digit
    $('.date').inputMask('AB',{
        A: /[0123]/, 
        B: function(args){
            if (args[0]==3) return /[01]/;
            return /[0-9]/
        }
    });
    $('.month').inputMask('AB',{
        A: /[01]/,
        B: function(args){ // args[0] correspond to first input character in mask
            if (args[0]==0) return /[0-9]/;
            return /[012]/
        }
    });
    $('.tel').inputMask('(X99) 999-99-99',{
        X: /[0]/
    });
    $('.group').inputGroup();
```




see demo [here](http:site.com)