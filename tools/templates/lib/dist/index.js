define("demo-lib", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.demoFunction = void 0;
    ///<amd-module name='demo-lib'/> 
    function demoFunction() {
        return 'Hello';
    }
    exports.demoFunction = demoFunction;
    ;
});
