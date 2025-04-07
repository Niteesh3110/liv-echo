import { ObjectId } from "mongodb";
import { differenceInYears } from "date-fns";

export const usernamePolicies = [
  {
    regex: /^.{5,20}$/,
    error: "Username must be between 5 and 20 characters long!",
  },
  {
    regex: /^[0-9A-Za-z]+$/,
    error: "Username must contain only alpha numeric characters!",
  },
];

export const passwordPolicies = [
  { regex: /.{6}/, error: "Password must have at least six characters!" },
  {
    regex: /[a-z]{1}/,
    error: "Password must have at least one lowercase character!",
  },
  {
    regex: /[A-Z]{1}/,
    error: "Password must have at least one uppercase character!",
  },
  {
    regex: /[0-9]{1}/,
    error: "Password must have at least one numeric character!",
  },
  {
    regex: /[^a-zA-Z0-9]/,
    error: "Password must have at least one special character!",
  },
];

const validateObject = (checkingObject, varName) => {
  if (typeof checkingObject === "undefined") {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type object, but it is undefined!`,
    ];
  }
  if (checkingObject == null) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type object, but it is null!`,
    ];
  }
  if (Array.isArray(checkingObject)) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type object, but it is an array!`,
    ];
  }
};

const validateString = (str, varName, checkObjectId) => {
  if (str == undefined) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is not provided!`,
    ];
  }
  if (str == null) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is null!`,
    ];
  }
  if (Array.isArray(str)) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is an array!`,
    ];
  }
  if (typeof str !== "string") {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is of type ${typeof str}!`,
    ];
  }
  const trimmedStr = str.trim();
  if (trimmedStr.length === 0) {
    throw [`String ${varName ? varName : ""} is empty or has only spaces!`];
  }
  if (
    checkObjectId &&
    checkObjectId === true &&
    !ObjectId.isValid(trimmedStr)
  ) {
    throw [`String (${trimmedStr}) is not a valid ObjectId!`];
  }
  return trimmedStr;
};

const validateLoginPassword = (str, varName) => {
  if (str == undefined) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is not provided!`,
    ];
  }
  if (str == null) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is null!`,
    ];
  }
  if (Array.isArray(str)) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is an array!`,
    ];
  }
  if (typeof str !== "string") {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type string, but it is of type ${typeof str}!`,
    ];
  }
  if (str.length === 0) {
    throw [`String ${varName ? varName : ""} is empty or has only spaces!`];
  }
};

const validateEmail = (email) => {
  email = validateString(email, "email");
  // got email regex from https://regex101.com/library/SOgUIV
  const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;

  if (!emailRegex.test(email)) {
    throw [`Email (${email}) is not valid!`];
  }
  return email.toLowerCase();
};

function validateBoolean(bool, varname) {
  if (typeof bool !== "boolean") {
    throw [`Variable (${varname || ""}) is not of type boolean!`];
  }
}

function validateUsername(str, varName) {
  let errors = [];
  try {
    str = validateString(str, varName);
  } catch (e) {
    errors = errors.concat(e);
  }

  for (const policy of usernamePolicies) {
    if (typeof str !== "string" || !policy.regex.test(str)) {
      errors = errors.concat(policy.error);
    }
  }

  if (errors.length !== 0) {
    throw errors;
  }

  return str.toLowerCase();
}

function validatePassword(str, varName) {
  let errors = [];
  try {
    if (str == undefined) {
      throw [
        `Expected ${
          varName ? varName : ""
        } to be of type string, but it is not provided!`,
      ];
    }
    if (str == null) {
      throw [
        `Expected ${
          varName ? varName : ""
        } to be of type string, but it is null!`,
      ];
    }

    if (typeof str !== "string") {
      throw [
        `Expected ${
          varName ? varName : ""
        } to be of type string, but it is of type ${typeof str}!`,
      ];
    }
    if (str.length === 0) {
      throw [`String ${varName ? varName : ""} is empty or has only spaces!`];
    }
  } catch (e) {
    errors = errors.concat(e);
  }

  for (const policy of passwordPolicies) {
    if (typeof str !== "string" || !policy.regex.test(str)) {
      errors = errors.concat(policy.error);
    }
  }

  if (errors.length !== 0) {
    throw errors;
  }
}

function validateNumber(num, varName) {
  if (typeof num !== "number") {
    throw [`${varName || ""} is not a number`];
  }
  if (isNaN(num)) {
    throw [`${varName || ""} is a not a valid number`];
  }
}

function validateArray(array, varName) {
  if (!Array.isArray(array)) {
    throw [
      `Expected ${
        varName ? varName : ""
      } to be of type array, but it is not an array!`,
    ];
  }
}

function validateDob(date, varName) {
  date = validateString(date);
  const now = new Date();
  const dob = new Date(date);

  let age = differenceInYears(now, dob);
  if (age < 13) {
    throw "Must be at least 13 years old to register";
  }
}

export default {
  validateString,
  validateLoginPassword,
  validateBoolean,
  validateObject,
  validateEmail,
  validateUsername,
  validateArray,
  validateNumber,
  validateDob,
};
