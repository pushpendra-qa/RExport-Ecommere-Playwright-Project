const { BasePage } = require('../base/BasePage');

class RoyalExportHomePage extends BasePage
{
    constructor(page)
    {
        super(page);
        this.headerBrandLink = page.locator('[alt="Royal Export Logo"]');
        this.currencySelectorButton = page.locator('[data-toggle="dropdown"]').first();
        this.currencyDropdown = page.locator('[class="dropdown-menu curre drop-cust"]');
        this.currencyOptions = this.currencyDropdown.locator('li');
        this.productPrices = page.locator('.price');
        this.visibleProductPrices = page.locator('.price:visible');
        this.kurtisNavLink = page.getByRole('link', { name: /^Kurtis$/ }).first();
        this.searchInput = page.locator('#pnlserarch.hidden-xs input[name="s"]').first();
        this.searchButton = page.locator('#proccesfind').first();
        this.searchResultProductNames = page.locator('.title a:visible');
        this.searchResultProductImages = page.locator('img[src*="product-img"]:visible');
    }

    async goTo()
    {
        await this.open('/');
    }

    async waitForHomePageHeader()
    {
        await this.headerBrandLink.waitFor({ state: 'visible' });
    }

    async clickHeaderBrandLink()
    {
        await this.headerBrandLink.waitFor({ state: 'visible', timeout: 30000 });
        await this.headerBrandLink.click();
        await this.page.waitForTimeout(2000);
    }

    async openCurrencySelector()
    {
        await this.currencySelectorButton.click();
        await this.currencyDropdown.waitFor({ state: 'visible' });
    }

    async getCurrencyOptionLabels()
    {
        return this.currencyOptions.evaluateAll(options =>
            options.map(option => option.textContent.trim())
        );
    }

    async selectCurrency(currencyCode)
    {
        await this.currencyOptions.filter({ hasText: currencyCode }).first().click();
        await this.currencyDropdown.waitFor({ state: 'hidden' });
    }

    async getFirstFiveProductPrices()
    {
        const prices =[];
        const count = await this.visibleProductPrices.count();
        for(let i=0; i<Math.min(count, 5); i++)
            {
                const price = await this.visibleProductPrices.nth(i).textContent();
                prices.push(price.trim());
            }
        return prices;
    }

    async getFirstFiveProductCurrencyIconClasses()
    {
        const iconClasses = [];
        const count = await this.visibleProductPrices.count();
        for(let i=0; i<Math.min(count, 5); i++)
            {
                const iconClass = await this.visibleProductPrices.nth(i).locator('i').getAttribute('class');
                iconClasses.push(iconClass);
            }
        return iconClasses;
    }

    async waitForFirstProductPriceToChange(previousPrice)
    {
        await this.page.waitForFunction(
            (price) =>
            {
                const firstVisiblePrice = Array.from(document.querySelectorAll('.price'))
                    .find(element => element.offsetParent !== null);
                return firstVisiblePrice && firstVisiblePrice.textContent.trim() !== price;
            },
            previousPrice
        );
    }

    async waitForProductCurrencyIcon(iconClass, timeout = 60000)
    {
        await this.page.waitForFunction(
            (expectedIconClass) =>
            {
                const updatedPrices = Array.from(document.querySelectorAll('.price'))
                    .filter(price => price.querySelector('i')?.className.includes(expectedIconClass));
                return updatedPrices.length >= 5;
            },
            iconClass,
            { timeout }
        );
    }

    async getVisibleProductPriceDetails(limit = 5)
    {
        return this.visibleProductPrices.evaluateAll((prices, productLimit) =>
            prices.slice(0, productLimit).map(price =>
            {
                const container = price.closest('.hover-details');
                return {
                    title: container?.querySelector('.title a')?.textContent.trim().replace(/\s+/g, ' ') || '',
                    price: price.textContent.trim(),
                    iconClass: price.querySelector('i')?.className || '',
                };
            }),
            limit
        );
    }

    async getProductPriceDetails()
    {
        return this.productPrices.evaluateAll(prices =>
            prices.map(price =>
            {
                let container = price;
                let title = '';
                for(let i=0; container && i<8; i++)
                    {
                        title = container.querySelector?.('.title a, h3 a, h4 a, .name a, a[href*=product]')?.textContent.trim().replace(/\s+/g, ' ') || '';
                        if(title)
                            {
                                break;
                            }
                        container = container.parentElement;
                    }
                return {
                    title,
                    price: price.textContent.trim(),
                    iconClass: price.querySelector('i')?.className || '',
                };
            }).filter(product => product.title && product.price)
        );
    }

    async getCurrencySelectorIconClass()
    {
        return this.currencySelectorButton.locator('i').first().getAttribute('class');
    }

    async goToKurtisCategory()
    {
        await this.kurtisNavLink.click();
        await this.page.waitForTimeout(3000);
    }

    async goBackToHomePage()
    {
        await this.page.goBack();
        await this.page.waitForTimeout(3000);
    }

    async getCookieValue(cookieName)
    {
        const cookies = await this.page.context().cookies();
        return cookies.find(cookie => cookie.name === cookieName)?.value;
    }

    async searchProduct(keyword)
    {
        await this.searchInput.waitFor({ state: 'visible', timeout: 30000 });
        await this.searchInput.click();
        await this.searchInput.fill(keyword);
        await this.searchButton.waitFor({ state: 'visible', timeout: 30000 });
        await this.searchButton.click();
        await this.page.waitForTimeout(5000);
    }

    async getSearchResultProductNames()
    {
        return this.searchResultProductNames.evaluateAll(products =>
            products.map(product => product.textContent.trim().replace(/\s+/g, ' '))
                .filter(productName => productName)
        );
    }
}

module.exports = { RoyalExportHomePage };
