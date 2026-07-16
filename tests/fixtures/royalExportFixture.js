const base = require('@playwright/test');
const { RoyalExportHomePage } = require('../../pages/royal-export/RoyalExportHomePage');

const test = base.test.extend({
    royalExportHomePage: async ({ page }, use) =>
    {
        await use(new RoyalExportHomePage(page));
    },
});

module.exports = {
    test,
    expect: base.expect,
};
