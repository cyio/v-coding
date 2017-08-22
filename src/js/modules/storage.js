class Storage {
  configCache = {}

  setValue (key, value) {
    var config = {};
    if (localStorage.config)
      config = JSON.parse(localStorage.config);

    config[key] = value;
    localStorage.config = JSON.stringify(config);
    return value;
  };

  getValue = function getValue(key, defaultValue) {
    if (!localStorage.config)
      return defaultValue;

    var config = JSON.parse(localStorage.config);
    if (typeof config[key] == "undefined")
      return defaultValue;

    return config[key];
  };

  setCacheValue = function setValue(key, value) {
    this.configCache[key] = value;
    return value;
  };

  getCacheValue = function getValue(key, defaultValue) {
    if (typeof this.configCache[key] != "undefined")
      return this.configCache[key];
    else
      return defaultValue;
  };

  keyExists = function keyExists(key) {
    if (!localStorage.config)
      return false;

    var config = JSON.parse(localStorage.config);
    return (config[key] != undefined);
  };

  setObject = function setObject(key, object) {
    localStorage[key] = JSON.stringify(object);
    return object;
  };

  getObject = function getObject(key) {
    if (localStorage[key] == undefined)
      return undefined;

    return JSON.parse(localStorage[key]);
  };

  refreshCache = function refreshCache() {
    this.configCache = {};
  };
}

export default new Storage()
