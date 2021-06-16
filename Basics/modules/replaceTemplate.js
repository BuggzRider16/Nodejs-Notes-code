/* module.export helps to export a file in node.js*/
/*
//     -) A placeholder in html file is in this format {%PLACEHOLDER%}
//     -) Here we are replacing all the placesholder of the html files so make the dynamic.
//     -) We used regular expression so that js instead of only replacing the first matching placeholder only
//        replaces all the matching placeholder in the whole file.
        -) Getting replaceTemplate as a module.
//     */

module.exports = (temp, product) => {
    let output = temp.replace(/{%PRODUCTNAME%}/g, product.productName);
    output = output.replace(/{%IMAGE%}/g, product.image);
    output = output.replace(/{%PRICE%}/g, product.price);
    output = output.replace(/{%FROM%}/g, product.from);
    output = output.replace(/{%NUTRIENTS%}/g, product.nutrients);
    output = output.replace(/{%QUANTITY%}/g, product.quantity);
    output = output.replace(/{%DESCRIPTION%}/g, product.description);
    output = output.replace(/{%ID%}/g, product.id);

    if (!product.organic) output = output.replace(/{%NOT_ORGANIC%}/g, 'not-organic');
    return output;
}