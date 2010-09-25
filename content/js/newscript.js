/////////////////////////////// global variables ///////////////////////////////

Components.utils.import("resource://scriptish/prefmanager.js");
Components.utils.import("resource://scriptish/utils/Scriptish_getConfig.js");

var bundle = null;
window.addEventListener("load", function() {
  // init the global string bundle
  bundle = document.getElementById("scriptish-browser-bundle");

  // load default namespace from pref
  document.getElementById("namespace").value =
      Scriptish_prefRoot.getValue("newscript_namespace", "");

  // default the includes with the current page's url
  var content = window.opener.document.getElementById("content");
  if (content) {
    document.getElementById("includes").value =
      content.selectedBrowser.contentWindow.location.href;
  }
}, false);

////////////////////////////////// functions ///////////////////////////////////

function doInstall() {
  var tools = {};
  Components.utils.import("resource://scriptish/utils/Scriptish_openInEditor.js", tools);
  Components.utils.import("resource://scriptish/utils/Scriptish_getTempFile.js", tools);
  Components.utils.import("resource://scriptish/utils/Scriptish_getWriteStream.js", tools);

  var script = createScriptSource();
  if (!script) return false;

  // put this created script into a file -- only way to install it
  var tempFile = tools.Scriptish_getTempFile();
  var foStream = tools.Scriptish_getWriteStream(tempFile);
  foStream.write(script, script.length);
  foStream.close();

  var config = Scriptish_getConfig();

  // create a script object with parsed metadata,
  script = config.parse(script);

  // make sure entered details will not ruin an existing file
  if (config.installIsUpdate(script)) {
    var overwrite = confirm(bundle.getString("newscript.exists"));
    if (!overwrite) return false;
  }

  // finish making the script object ready to install
  script.setDownloadedFile(tempFile);

  // install this script
  config.install(script);

  // and fire up the editor!
  tools.Scriptish_openInEditor(script, window);

  // persist namespace value
  Scriptish_prefRoot.setValue("newscript_namespace", script.namespace);

  return true;
}

// assemble the XUL fields into a script template
function createScriptSource() {
  var script = ["// ==UserScript=="];

  var name = document.getElementById("name").value;
  if ("" == name) {
    alert(bundle.getString("newscript.noname"));
    return false;
  } else {
    script.push("// @name           " + name);
  }

  var namespace = document.getElementById("namespace").value;
  if ("" == namespace) {
    alert(bundle.getString("newscript.nonamespace"));
    return false;
  } else {
    script.push("// @namespace      " + namespace);
  }

  var descr = document.getElementById("descr").value;
  if ("" != descr) {
    script.push("// @description    " + descr);
  }

  var includes = document.getElementById("includes").value;
  if ("" != includes) {
    includes = includes.match(/.+/g);
    includes = "// @include        " + includes.join("\n// @include        ");
    script.push(includes);
  }

  var excludes = document.getElementById("excludes").value;
  if ("" != excludes) {
    excludes = excludes.match(/.+/g);
    excludes = "// @exclude        " + excludes.join("\n// @exclude        ");
    script.push(excludes);
  }

  script.push("// ==/UserScript==");

  var ending = "\n";
  if (window.navigator.platform.match(/^Win/)) ending = "\r\n";
  script = script.join(ending);

  return script;
}