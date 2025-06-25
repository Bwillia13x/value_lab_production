"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVaR = calculateVaR;
exports.calculateES = calculateES;
exports.calculateBeta = calculateBeta;
exports.calculateSharpeRatio = calculateSharpeRatio;
const mathjs_1 = require("mathjs");
// Calculate Value at Risk (VaR)
function calculateVaR(returns, confidenceLevel = 0.95) {
    if (returns.length === 0)
        return 0;
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return sortedReturns[index];
}
// Calculate Expected Shortfall (ES)
function calculateES(returns, confidenceLevel = 0.95) {
    if (returns.length === 0)
        return 0;
    const varValue = calculateVaR(returns, confidenceLevel);
    const tailReturns = returns.filter(r => r < varValue);
    if (tailReturns.length === 0)
        return 0;
    return (0, mathjs_1.mean)(...tailReturns);
}
// Calculate Beta
function calculateBeta(assetReturns, marketReturns) {
    const assetMean = (0, mathjs_1.mean)(...assetReturns);
    const marketMean = (0, mathjs_1.mean)(...marketReturns);
    let covariance = 0;
    let marketVariance = 0;
    for (let i = 0; i < assetReturns.length; i++) {
        covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
        marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
    }
    return covariance / marketVariance;
}
// Calculate Sharpe Ratio
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (returns.length === 0)
        return 0;
    const excessReturns = returns.map(r => r - riskFreeRate);
    const excessMean = (0, mathjs_1.mean)(...excessReturns);
    const excessStd = (0, mathjs_1.std)(...excessReturns);
    if (excessStd === 0)
        return 0;
    return excessMean / excessStd;
}
