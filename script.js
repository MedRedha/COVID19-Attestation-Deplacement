const H5F = H5F || {};

(function(d) {
  const field = d.createElement("input"),
    emailPatt = new RegExp("([a-z0-9_.-]+)@([0-9a-z.-]+).([a-z.]{2,6})", "i"),
    urlPatt = new RegExp("^http://", "i");
  let usrPatt, curEvt, args;

  H5F.setup = function(form, settings) {
    const isCollection = !form.nodeType || false;

    const opts = {
      validClass: "valid",
      invalidClass: "error",
      requiredClass: "required"
    };

    if (typeof settings === "object") {
      for (let i in opts) {
        if (typeof settings[i] === "undefined") {
          settings[i] = opts[i];
        }
      }
    }

    args = settings || opts;

    if (isCollection) {
      let k = 0;
      const len = form.length;
      for (; k < len; k++) {
        H5F.validation(form[k]);
      }
    } else {
      H5F.validation(form);
    }
  };

  H5F.validation = function(form) {
    const f = form.elements;
    let flen = f.length,
      isRequired;

    H5F.listen(form, "invalid", H5F.checkField, true);
    H5F.listen(form, "blur", H5F.checkField, true);
    H5F.listen(form, "input", H5F.checkField, true);
    H5F.listen(form, "focus", H5F.checkField, true);

    if (!H5F.support()) {
      form.checkValidity = function(e, f) {
        H5F.checkValidity("", form);
      };

      while (flen--) {
        isRequired = !!f[flen].attributes["required"];
        // Firefox includes fieldsets inside elements nodelist so we filter it out.
        if (f[flen].nodeName !== "FIELDSET" && isRequired) {
          H5F.validity(f[flen]); // Add validity object to field
        }
      }
    }
  };
  H5F.validity = function(el) {
    const elem = el,
      missing = H5F.valueMissing(elem),
      type = elem.getAttribute("type"),
      pattern = elem.getAttribute("pattern"),
      placeholder = elem.getAttribute("placeholder"),
      isType = /^(email|url|password)$/i,
      fType = isType.test(type) ? type : pattern ? pattern : false,
      patt = H5F.pattern(elem, fType),
      step = H5F.range(elem, "step"),
      min = H5F.range(elem, "min"),
      max = H5F.range(elem, "max");

    elem.validity = {
      patternMismatch: patt,
      rangeOverflow: max,
      rangeUnderflow: min,
      stepMismatch: step,
      valid: !missing && !patt && !step && !min && !max,
      valueMissing: missing
    };

    if (placeholder && curEvt !== "input") {
      H5F.placeholder(elem);
    }
    elem.checkValidity = function(e, el) {
      H5F.checkValidity(e, elem);
    };
  };
  H5F.checkField = function(e) {
    const el = H5F.getTarget(e) || e, // checkValidity method passes element not event
      events = /^(input|focusin|focus)$/i;

    curEvt = e.type;
    if (!H5F.support()) {
      H5F.validity(el);
    }

    if (el.validity.valid) {
      H5F.removeClass(el, args.invalidClass);
      H5F.removeClass(el, args.requiredClass);
      H5F.addClass(el, args.validClass);
    } else if (!events.test(curEvt)) {
      if (el.validity.valueMissing) {
        H5F.removeClass(el, args.invalidClass);
        H5F.removeClass(el, args.validClass);
        H5F.addClass(el, args.requiredClass);
      } else {
        H5F.removeClass(el, args.validClass);
        H5F.removeClass(el, args.requiredClass);
        H5F.addClass(el, args.invalidClass);
      }
    } else if (el.validity.valueMissing) {
      H5F.removeClass(el, args.requiredClass);
      H5F.removeClass(el, args.invalidClass);
      H5F.removeClass(el, args.validClass);
    }
  };
  H5F.checkValidity = function(e, el) {
    let f,
      ff,
      isRequired,
      invalid = false;

    if (el.nodeName === "FORM") {
      f = el.elements;

      let i = 0;
      const len = f.length;
      for (; i < len; i++) {
        ff = f[i];

        isRequired = !!ff.attributes["required"];

        if (ff.nodeName !== "FIELDSET" && isRequired) {
          H5F.checkField(ff);
          if (!ff.validity.valid && !invalid) {
            ff.focus();
            invalid = true;
          }
        }
      }
    } else {
      H5F.checkField(el);
      return el.validity.valid;
    }
  };

  H5F.support = function() {
    return (
      H5F.isHostMethod(field, "validity") &&
      H5F.isHostMethod(field, "checkValidity")
    );
  };

  // Create helper methods to emulate attributes in older browsers
  H5F.pattern = function(el, type) {
    if (type === "email") {
      return !emailPatt.test(el.value);
    } else if (type === "url") {
      return !urlPatt.test(el.value);
    } else if (!type || type === "password") {
      // Password can't be evalutated.
      return false;
    } else {
      usrPatt = new RegExp(type);
      return !usrPatt.test(el.value);
    }
  };
  H5F.placeholder = function(el) {
    const placeholder = el.getAttribute("placeholder"),
      focus = /^(focus|focusin)$/i,
      node = /^(input|textarea)$/i,
      isNative = !!("placeholder" in field);

    if (!isNative && node.test(el.nodeName)) {
      if (el.value === "") {
        el.value = placeholder;
      } else if (el.value === placeholder && focus.test(curEvt)) {
        el.value = "";
      }
    }
  };
  H5F.range = function(el, type) {
    // Emulate min, max and step
    const min = parseInt(el.getAttribute("min"), 10) || 0,
      max = parseInt(el.getAttribute("max"), 10) || false,
      step = parseInt(el.getAttribute("step"), 10) || 1,
      val = parseInt(el.value, 10),
      mismatch = (val - min) % step;

    if (!H5F.valueMissing(el) && !isNaN(val)) {
      if (type === "step") {
        return el.getAttribute("step") ? mismatch !== 0 : false;
      } else if (type === "min") {
        return el.getAttribute("min") ? val < min : false;
      } else if (type === "max") {
        return el.getAttribute("max") ? val > max : false;
      }
    } else if (el.getAttribute("type") === "number") {
      return true;
    } else {
      return false;
    }
  };
  H5F.required = function(el) {
    const required = !!el.attributes["required"];

    return required ? H5F.valueMissing(el) : false;
  };
  H5F.valueMissing = function(el) {
    const placeholder = el.getAttribute("placeholder");
    return !!(el.value === "" || el.value === placeholder);
  };

  /* Util methods */
  H5F.listen = function(node, type, fn, capture) {
    if (H5F.isHostMethod(window, "addEventListener")) {
      /* FF & Other Browsers */
      node.addEventListener(type, fn, capture);
    } else if (
      H5F.isHostMethod(window, "attachEvent") &&
      typeof window.event !== "undefined"
    ) {
      /* Internet Explorer way */
      if (type === "blur") {
        type = "focusout";
      } else if (type === "focus") {
        type = "focusin";
      }
      node.attachEvent("on" + type, fn);
    }
  };
  H5F.preventActions = function(evt) {
    evt = evt || window.event;

    if (evt.stopPropagation && evt.preventDefault) {
      evt.stopPropagation();
      evt.preventDefault();
    } else {
      evt.cancelBubble = true;
      evt.returnValue = false;
    }
  };
  H5F.getTarget = function(evt) {
    evt = evt || window.event;
    return evt.target || evt.srcElement;
  };
  H5F.addClass = function(e, c) {
    let re;
    if (!e.className) {
      e.className = c;
    } else {
      re = new RegExp("(^|\\s)" + c + "(\\s|$)");
      if (!re.test(e.className)) {
        e.className += " " + c;
      }
    }
  };
  H5F.removeClass = function(e, c) {
    let re, m;
    if (e.className) {
      if (e.className == c) {
        e.className = "";
      } else {
        re = new RegExp("(^|\\s)" + c + "(\\s|$)");
        m = e.className.match(re);
        if (m && m.length == 3) {
          e.className = e.className.replace(re, m[1] && m[2] ? " " : "");
        }
      }
    }
  };
  H5F.isHostMethod = function(o, m) {
    const t = typeof o[m],
      reFeaturedMethod = new RegExp("^function|object$", "i");
    return !!((reFeaturedMethod.test(t) && o[m]) || t == "unknown");
  };
})(document);
