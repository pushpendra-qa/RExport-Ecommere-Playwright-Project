const { test, expect } = require('../fixtures/royalExportFixture');
const { homePageData } = require('../../test-data/royal-export/homePageData');

function parsePrice(priceText)
{
    return Number(priceText.replace(/[^0-9.]/g, ''));
}

test('User can open the Royal Export home page from the header brand link', async ({ page, royalExportHomePage }) =>
{
    await royalExportHomePage.goTo();
    await royalExportHomePage.waitForHomePageHeader();

    console.log('Page title:', await page.title());
    await expect(page).toHaveTitle(homePageData.expectedTitle);
    await expect(royalExportHomePage.headerBrandLink).toBeVisible();

    await royalExportHomePage.clickHeaderBrandLink();

    await expect(page).toHaveURL(homePageData.expectedHomeUrl);
});

test('User can view all currency options from the home page selector', async ({ page, royalExportHomePage }) =>
{
    await royalExportHomePage.goTo();
    await royalExportHomePage.waitForHomePageHeader();

    console.log('Page title:', await page.title());
    await expect(page).toHaveTitle(homePageData.expectedTitle);
    await expect(royalExportHomePage.currencySelectorButton).toBeVisible();

    await royalExportHomePage.openCurrencySelector();

    await expect(royalExportHomePage.currencyDropdown).toBeVisible();
    await expect(royalExportHomePage.currencyOptions).toHaveCount(homePageData.expectedCurrencies.length);
    await expect(royalExportHomePage.currencyOptions).toHaveText(homePageData.expectedCurrencies);

    const actualCurrencies = await royalExportHomePage.getCurrencyOptionLabels();
    console.log('Total currencies:', actualCurrencies.length);
    console.log('Currency options:', actualCurrencies);

    expect(actualCurrencies).toEqual(homePageData.expectedCurrencies);

    await royalExportHomePage.selectCurrency('USD');

    await expect(royalExportHomePage.currencyDropdown).toBeHidden();
});

test('Verify price updates across homepage when currency is switched to USD', async ({ royalExportHomePage }) =>
{
    await royalExportHomePage.goTo();

    await royalExportHomePage.waitForHomePageHeader();

    const inrProductDetails = await royalExportHomePage.getVisibleProductPriceDetails(5);
    const allInrProductDetails = await royalExportHomePage.getProductPriceDetails();

    console.log('Prices before currency switch');
    console.log(inrProductDetails);

    expect(inrProductDetails.length).toBeGreaterThanOrEqual(5);
    expect(inrProductDetails.every(product => product.title && product.price)).toBeTruthy();
    expect(inrProductDetails.every(product => product.iconClass.includes('fa-india'))).toBeTruthy();
    expect(allInrProductDetails.length).toBeGreaterThanOrEqual(5);

    await royalExportHomePage.openCurrencySelector();
    await royalExportHomePage.selectCurrency('USD');
    await royalExportHomePage.waitForProductCurrencyIcon('fa-usa');

    const usdProductDetails = await royalExportHomePage.getProductPriceDetails();

    console.log('Prices after currency switch');
    console.log(usdProductDetails);

    expect(usdProductDetails.length).toBeGreaterThanOrEqual(5);
    expect(usdProductDetails.slice(0, 5).every(product => product.iconClass.includes('fa-usa'))).toBeTruthy();

    const inrProductsByTitle = new Map(
        allInrProductDetails.map(product => [product.title, product])
    );
    const matchedProducts = usdProductDetails
        .filter(usdProduct => inrProductsByTitle.has(usdProduct.title))
        .slice(0, 5)
        .map(usdProduct =>
        {
            const inrProduct = inrProductsByTitle.get(usdProduct.title);
            return {
                title: usdProduct.title,
                inrPrice: parsePrice(inrProduct.price),
                usdPrice: parsePrice(usdProduct.price),
            };
        });

    expect(matchedProducts.length).toBeGreaterThanOrEqual(5);

    const conversionRates = matchedProducts.map(product => product.inrPrice / product.usdPrice);
    const firstConversionRate = conversionRates[0];

    console.log('Matched products:', matchedProducts);
    console.log('Conversion rates:', conversionRates);

    for(const conversionRate of conversionRates)
        {
            expect(conversionRate).toBeGreaterThan(0);
            expect(Math.abs(conversionRate - firstConversionRate)).toBeLessThanOrEqual(0.15);
        }
});

test('Verify currency selection persists after navigating to a category page and back', async ({ page, royalExportHomePage }) =>
{
    await royalExportHomePage.goTo();
    await royalExportHomePage.waitForHomePageHeader();

    await royalExportHomePage.openCurrencySelector();
    await royalExportHomePage.selectCurrency('AED');
    await royalExportHomePage.waitForProductCurrencyIcon('fa-uae');

    await expect.poll(async () => royalExportHomePage.getCurrencySelectorIconClass()).toContain('fa-uae');
    await expect.poll(async () => royalExportHomePage.getCookieValue('selected_currency')).toBe(homePageData.aedCurrencyCookieValue);

    const homePageAedPrices = await royalExportHomePage.getVisibleProductPriceDetails(5);
    expect(homePageAedPrices.length).toBeGreaterThanOrEqual(5);
    expect(homePageAedPrices.every(product => product.iconClass.includes('fa-uae'))).toBeTruthy();

    await royalExportHomePage.goToKurtisCategory();

    await expect(page).toHaveURL(/wholesale-kurtis/);
    await expect.poll(async () => royalExportHomePage.getCurrencySelectorIconClass()).toContain('fa-uae');

    const kurtisPageAedPrices = await royalExportHomePage.getVisibleProductPriceDetails(5);
    expect(kurtisPageAedPrices.length).toBeGreaterThanOrEqual(5);
    expect(kurtisPageAedPrices.every(product => product.iconClass.includes('fa-uae'))).toBeTruthy();

    await royalExportHomePage.goBackToHomePage();
    await royalExportHomePage.waitForHomePageHeader();

    await expect(page).toHaveURL(homePageData.expectedHomeUrl);
    await expect.poll(async () => royalExportHomePage.getCurrencySelectorIconClass()).toContain('fa-uae');
    await expect.poll(async () => royalExportHomePage.getCookieValue('selected_currency')).toBe(homePageData.aedCurrencyCookieValue);

    const returnedHomePageAedPrices = await royalExportHomePage.getVisibleProductPriceDetails(5);
    expect(returnedHomePageAedPrices.length).toBeGreaterThanOrEqual(5);
    expect(returnedHomePageAedPrices.every(product => product.iconClass.includes('fa-uae'))).toBeTruthy();
});

test('Verify search returns relevant results for a valid keyword', async ({ page, royalExportHomePage }) =>
{
    await royalExportHomePage.goTo();
    await royalExportHomePage.waitForHomePageHeader();

    await expect(royalExportHomePage.searchInput).toBeVisible();

    await royalExportHomePage.searchProduct(homePageData.searchKeyword);

    await expect(page).toHaveURL(/\/search\?s=Banarasi\+Saree/);
    await expect(royalExportHomePage.searchResultProductNames.first()).toBeVisible();
    await expect(royalExportHomePage.searchResultProductImages.first()).toBeVisible();

    const resultProductNames = await royalExportHomePage.getSearchResultProductNames();
    console.log('Search results for keyword:', homePageData.searchKeyword);
    console.log(resultProductNames);

    expect(resultProductNames.length).toBeGreaterThanOrEqual(1);
    expect(
        resultProductNames.some(productName =>
            productName.toLowerCase().includes('banarasi') &&
            productName.toLowerCase().includes('saree')
        )
    ).toBeTruthy();
});
