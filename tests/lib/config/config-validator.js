/**
 * @fileoverview Tests for config validator.
 * @author Brandon Mills
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("chai").assert,
    Linter = require("../../../lib/Linter"),
    validator = require("../../../lib/config/config-validator");
const eslint = new Linter();

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

/**
 * Fake a rule object
 * @param {Object} context context passed to the rules by eslint
 * @returns {Object} mocked rule listeners
 * @private
 */
function mockRule(context) {
    return {
        Program(node) {
            context.report(node, "Expected a validation error.");
        }
    };
}

mockRule.schema = [
    {
        enum: ["first", "second"]
    }
];

/**
 * Fake a rule object
 * @param {Object} context context passed to the rules by eslint
 * @returns {Object} mocked rule listeners
 * @private
 */
function mockObjectRule(context) {
    return {
        Program(node) {
            context.report(node, "Expected a validation error.");
        }
    };
}

mockObjectRule.schema = {
    enum: ["first", "second"]
};

/**
 * Fake a rule with no options
 * @param {Object} context context passed to the rules by eslint
 * @returns {Object} mocked rule listeners
 * @private
 */
function mockNoOptionsRule(context) {
    return {
        Program(node) {
            context.report(node, "Expected a validation error.");
        }
    };
}

mockNoOptionsRule.schema = [];

const mockRequiredOptionsRule = {
    meta: {
        schema: {
            type: "array",
            minItems: 1
        }
    },
    create(context) {
        return {
            Program(node) {
                context.report(node, "Expected a validation error.");
            }
        };
    }
};

describe("Validator", () => {

    beforeEach(() => {
        eslint.defineRule("mock-rule", mockRule);
        eslint.defineRule("mock-required-options-rule", mockRequiredOptionsRule);
    });

    describe("validate", () => {

        it("should do nothing with an empty config", () => {
            const fn = validator.validate.bind(null, {}, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with an empty rules object", () => {
            const fn = validator.validate.bind(null, { rules: {} }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": [2, "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is off", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["off", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with an invalid config when severity is off", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-required-options-rule": "off" } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with an invalid config when severity is an array with 'off'", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-required-options-rule": ["off"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is warn", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["warn", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is error", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["error", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is Off", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["Off", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is Warn", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["Warn", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should do nothing with a valid config when severity is Error", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": ["Error", "second"] } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should catch invalid rule options", () => {
            const fn = validator.validate.bind(null, { rules: { "mock-rule": [3, "third"] } }, "tests", eslint.rules, eslint.environments);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '3').\n");
        });

        it("should allow for rules with no options", () => {
            eslint.defineRule("mock-no-options-rule", mockNoOptionsRule);

            const fn = validator.validate.bind(null, { rules: { "mock-no-options-rule": 2 } }, "tests", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

        it("should not allow options for rules with no options", () => {
            eslint.defineRule("mock-no-options-rule", mockNoOptionsRule);

            const fn = validator.validate.bind(null, { rules: { "mock-no-options-rule": [2, "extra"] } }, "tests", eslint.rules, eslint.environments);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-no-options-rule\" is invalid:\n\tValue \"extra\" has more items than allowed.\n");
        });

        it("should throw with an array environment", () => {
            const fn = validator.validate.bind(null, { env: [] }, "", eslint.rules, eslint.environments);

            assert.throws(fn, "Environment must not be an array");
        });

        it("should throw with a primitive environment", () => {
            const fn = validator.validate.bind(null, { env: 1 }, "", eslint.rules, eslint.environments);

            assert.throws(fn, "Environment must be an object");
        });

        it("should catch invalid environments", () => {
            const fn = validator.validate.bind(null, { env: { browser: true, invalid: true } }, "", eslint.rules, eslint.environments);

            assert.throws(fn, "Environment key \"invalid\" is unknown\n");
        });

        it("should catch disabled invalid environments", () => {
            const fn = validator.validate.bind(null, { env: { browser: true, invalid: false } }, "", eslint.rules, eslint.environments);

            assert.throws(fn, "Environment key \"invalid\" is unknown\n");
        });

        it("should do nothing with an undefined environment", () => {
            const fn = validator.validate.bind(null, {}, "", eslint.rules, eslint.environments);

            assert.doesNotThrow(fn);
        });

    });

    describe("getRuleOptionsSchema", () => {

        it("should return null for a missing rule", () => {
            assert.equal(validator.getRuleOptionsSchema("non-existent-rule", eslint.rules), null);
        });

        it("should not modify object schema", () => {
            eslint.defineRule("mock-object-rule", mockObjectRule);
            assert.deepEqual(validator.getRuleOptionsSchema("mock-object-rule", eslint.rules), {
                enum: ["first", "second"]
            });
        });

    });

    describe("validateRuleOptions", () => {

        it("should throw for incorrect warning level number", () => {
            const fn = validator.validateRuleOptions.bind(null, "mock-rule", 3, "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '3').\n");
        });

        it("should throw for incorrect warning level string", () => {
            const fn = validator.validateRuleOptions.bind(null, "mock-rule", "booya", "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '\"booya\"').\n");
        });

        it("should throw for invalid-type warning level", () => {
            const fn = validator.validateRuleOptions.bind(null, "mock-rule", [["error"]], "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '[ \"error\" ]').\n");
        });

        it("should only check warning level for nonexistent rules", () => {
            const fn = validator.validateRuleOptions.bind(null, "non-existent-rule", [3, "foobar"], "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"non-existent-rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '3').\n");
        });

        it("should only check warning level for plugin rules", () => {
            const fn = validator.validateRuleOptions.bind(null, "plugin/rule", 3, "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"plugin/rule\" is invalid:\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed '3').\n");
        });

        it("should throw for incorrect configuration values", () => {
            const fn = validator.validateRuleOptions.bind(null, "mock-rule", [2, "frist"], "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tValue \"frist\" must be an enum value.\n");
        });

        it("should throw for too many configuration values", () => {
            const fn = validator.validateRuleOptions.bind(null, "mock-rule", [2, "first", "second"], "tests", eslint.rules);

            assert.throws(fn, "tests:\n\tConfiguration for rule \"mock-rule\" is invalid:\n\tValue \"first,second\" has more items than allowed.\n");
        });

    });

});
