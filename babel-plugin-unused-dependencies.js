// https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-basics
//
// https://github.com/babel/babel/search?utf8=%E2%9C%93&q=codeFrame&type=Code
var util = require('util');
var codeFrame = require('babel-code-frame');

module.exports = function(babel) {
    var t = babel.types; // docs: https://github.com/babel/babel/tree/master/packages/babel-types#babel-types

    var get_service_expr_names = "sap.bi.framework.getService".split(".");

  return {
    visitor: {
        VariableDeclarator: function(path) {
            var node = path.node;
            if (t.isCallExpression(node.init)) {
                var callee = node.init.callee;
                if (t.isIdentifier(callee, {name: "require"}) ||
                    isDotMemberExpr(callee, get_service_expr_names)) {
                    // console.log(path.node.id.name, "\n\n", util.inspect(path.scope.getBinding(path.node.id.name), false, 2, true));
                    if (!path.scope.getBinding(node.id.name).referenced) {
                        // throw path.buildCodeFrameError("unused dependency!");
                        var startLoc = node.loc.start;
                        console.log("Warning! Unused dependency:");
                        console.log(codeFrame(path.hub.file.code,
                            startLoc.line, startLoc.column + 1, { highlightCode: true }));
                    }

                // } else if (isDotMemberExpr(callee, get_service_expr_names)) {
                //     console.log("yeah member expr!");
                }
            }
        }
    }
  };

    function isDotMemberExpr(expr, exprNames) {
        debugger;
        var subExpr = expr;
        var len = exprNames.length;
        for (var i = len - 1; i > 0; --i) {
            if (!(t.isMemberExpression(subExpr) &&
                  t.isIdentifier(subExpr.property) &&
                  subExpr.property.name === exprNames[i]
                 )) {
                return false;
            }
            subExpr = subExpr.object;
        }

        if (!(t.isIdentifier(subExpr) && subExpr.name === exprNames[0])) {
            return false;
        }

        return true;
    }
};
