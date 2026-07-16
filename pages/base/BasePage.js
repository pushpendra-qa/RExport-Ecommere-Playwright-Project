class BasePage
{
    constructor(page)
    {
        this.page = page;
    }

    async open(path = '/')
    {
        const baseUrl = process.env.BASE_URL || 'https://www.royalexport.in';
        const targetUrl = /^https?:\/\//i.test(path)
            ? path
            : new URL(path, baseUrl).toString();

        await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    }

    async waitForPageReady()
    {
        await this.page.waitForLoadState('domcontentloaded');
    }
}

module.exports = { BasePage };
