// https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-basics
//
// https://github.com/babel/babel/search?utf8=%E2%9C%93&q=codeFrame&type=Code
var util = require('util');
var codeFrame = require('babel-code-frame');

module.exports = function(babel) {
    var t = babel.types; // docs: https://github.com/babel/babel/tree/master/packages/babel-types#babel-types

    var get_service_expr_names = "sap.bi.framework.getService".split(".");
    var jQuery_sap_require_expr_names = "jQuery.sap.require".split(".");
    var $_sap_require_expr_names = "$.sap.require".split("."); // TODO: unifiy

  return {
      pre: function(state) {
          this.allUi5Requires = [];
      },
      post: function(state) {
            for (var i = 0, len = this.allUi5Requires.length; i < len; i++) {
                var ui5Require = this.allUi5Requires[i];
                if (!this.allUi5Requires[i].referenced) {
                    printCodeFrame("Warning! Unused dependency:", ui5Require.path);
                }
            }
      },
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
                        printCodeFrame("Warning! Unused dependency:", path);
                    }
                }
            }
        },
        CallExpression: function(path) {
            var node = path.node;
            if (!isDotMemberExpr(node.callee, jQuery_sap_require_expr_names) &&
                !isDotMemberExpr(node.callee, $_sap_require_expr_names)) {
                return;
            }

            var scope = path.scope;
            scope.ui5Requires = scope.ui5Requires || [];
            var ui5Require = {pkg: node.arguments[0].value.split("."), referenced: false, path: path};
            scope.ui5Requires.push(ui5Require);
            this.allUi5Requires.push(ui5Require);
            //console.log(util.inspect(path, false, 1, true));
        },
        MemberExpression: function(path) {
            if (t.isMemberExpression(path.parent)) {
                return;
            }

            var pkg = memberExprToTokenArr(path.node);
            if (pkg) {
                var foundImport = someUI5RequireInScope(path, function(ui5Require) {
                    if (arrayStartsWith(pkg, ui5Require.pkg)) {
                        ui5Require.referenced = true;
                        return true;
                    }
                });

                // TODO: we could also catch missing imports... more work necessary here to whitelist certain stuff
                if (!foundImport && pkg[0] === "sap" && pkg[1] === "fpa") {
                    printCodeFrame("Warning! Missing Import:", path);
                }
            }
        }
    }
  };

  function printCodeFrame(message, path) {
    var startLoc = path.node.loc.start;
    console.log(message);
    console.log(codeFrame(path.hub.file.code,
        startLoc.line, startLoc.column + 1, { highlightCode: true }));
  }

    function someUI5RequireInScope(path, callback) {
        var scope = path.scope;
        do {
            if (scope.ui5Requires) {
                for (var i = 0, len = scope.ui5Requires.length; i < len; ++i) {
                    if (callback(scope.ui5Requires[i]) === true) {
                        return true;
                    }
                }
            }
            scope = scope.parent;
        } while (scope);

        return false;
    }

    function isDotMemberExpr(expr, exprNames) {
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

        if (t.isIdentifier(subExpr) && subExpr.name === exprNames[0]) {
            return true;
        }

        return false;
    }

    function arrayStartsWith(arr, subArr) {
        for (var i = 0, len = subArr.length; i < len; ++i) {
            if (arr[i] !== subArr[i]) {
                return false;
            }
        }

        return true;
    }

    function memberExprToTokenArr(memberExpr) {
        var arr = [];
        var subExpr = memberExpr;
        do {
            if (!t.isIdentifier(subExpr.property)) {
                return;
            }
            arr.unshift(subExpr.property.name);
            subExpr = subExpr.object;

        } while (t.isMemberExpression(subExpr));

        if (!t.isIdentifier(subExpr)) {
            return;
        }
        arr.unshift(subExpr.name);

        return arr;
    }

    function memberExprToDotStr(memberExpr) {
        var str = "";
        var subExpr = memberExpr;
        do {
            if (!t.isIdentifier(subExpr.property)) {
                return;
            }
            str = str.length === 0 ? subExpr.property.name : subExpr.property.name + "." + str;
            subExpr = subExpr.object;

        } while (t.isMemberExpression(subExpr));

        if (!t.isIdentifier(subExpr)) {
            return;
        }
        str = str.length === 0 ? subExpr.name : subExpr.name + "." + str;

        return str;
    }
};
