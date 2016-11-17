// https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-basics
//
// https://github.com/babel/babel/search?utf8=%E2%9C%93&q=codeFrame&type=Code
var util = require('util');
var codeFrame = require('babel-code-frame');

module.exports = function(babel) {
  var t = babel.types; // docs: https://github.com/babel/babel/tree/master/packages/babel-types#babel-types
  return {
    visitor: {
      // callexpression: function(path) {
      //     if (path.node.callee.name !== "require") {
      //         console.log(util.inspect(path, false, 2, true));
      //     } else {
      //         return;
      //     }
      //         //throw path.buildcodeframeerror("require found!");
      //         // throw path.buildcodeframeerror("error message here");
      // }
        VariableDeclarator: function(path) {
            var node = path.node;
            // TODO: use babel.types?
            if (t.isCallExpression(node.init)) {
                var callee = node.init.callee;
                if (t.isIdentifier(callee, {name: "require"})) {
                    // console.log(path.node.id.name, "\n\n", util.inspect(path.scope.getBinding(path.node.id.name), false, 2, true));
                    if (!path.scope.getBinding(node.id.name).referenced) {
                        // throw path.buildCodeFrameError("unused dependency!");
                        var startLoc = node.loc.start;
                        console.log("Warning! Unused dependency:");
                        console.log(codeFrame(path.hub.file.code,
                            startLoc.line, startLoc.column + 1, { highlightCode: true }));
                    }

                }
            }
        }
    }
  };
};
