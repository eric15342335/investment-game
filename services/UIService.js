export class UIService {
    constructor(elements, cryptoBalances) {
        this.elements = elements;
        this.cryptoBalances = cryptoBalances;
    }

    updatePriceTrend(currentPrice, previousPrice) {
        const trend = currentPrice > previousPrice ? '↑' : '↓';
        const percentChange = ((currentPrice - previousPrice) / previousPrice * 100).toFixed(2);
        this.elements.priceTrend.textContent = `${trend} ${Math.abs(percentChange)}%`;
        this.elements.priceTrend.className = `price-trend ${currentPrice >= previousPrice ? '' : 'down'}`;
    }

    updateBuySliderValue() {
        const value = this.elements.buySlider.value;
        this.elements.buySliderValue.textContent = this.formatNumber(value);
    }

    updateSellSliderValue() {
        const value = this.elements.sellSlider.value;
        this.elements.sellSliderValue.textContent = (+value).toFixed(8);
    }

    addToHistory(type, crypto, cryptoAmount, usdAmount) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${type} ${cryptoAmount.toFixed(8)} ${crypto}</span>
            <span>$${this.formatNumber(usdAmount)}</span>
        `;
        this.elements.history.insertBefore(historyItem, this.elements.history.firstChild);
    }

    updateMainUI(selectedCrypto, usdBalance, totalValue, roi) {
        this.elements.selectedCrypto.textContent = selectedCrypto;
        this.elements.cryptoPrice.textContent = `$${this.formatNumber(this.cryptoBalances[selectedCrypto].price)}`;
        this.elements.usdBalance.textContent = this.formatNumber(usdBalance);
        this.elements.totalValue.textContent = this.formatNumber(totalValue);
        this.elements.roi.textContent = roi;
        this.elements.roi.parentElement.className = `value ${parseFloat(roi) >= 0 ? 'positive' : 'negative'}`;
    }

    updateCryptoBalances() {
        this.elements.cryptoBalances.innerHTML = Object.entries(this.cryptoBalances)
            .map(([crypto, data]) => `
                <div class="balance-item">
                    <span class="label">
                        <span class="material-icons">${
                            crypto === 'BTC' ? 'currency_bitcoin' :
                            crypto === 'ETH' ? 'diamond' : 'pets'
                        }</span>
                        ${crypto}:
                    </span>
                    <span class="value">${data.amount.toFixed(8)}</span>
                </div>
            `).join('');
    }

    updateSliders(usdBalance, selectedCrypto) {
        this.elements.buySlider.max = usdBalance;
        this.elements.sellSlider.max = this.cryptoBalances[selectedCrypto].amount;
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    toggleDCAButton(isActive) {
        if (isActive) {
            this.elements.dcaToggle.innerHTML = '<span class="material-icons">stop</span>Stop DCA';
            this.elements.dcaToggle.classList.add('active');
        } else {
            this.elements.dcaToggle.innerHTML = '<span class="material-icons">play_arrow</span>Start DCA';
            this.elements.dcaToggle.classList.remove('active');
        }
    }

    updateCryptoButtons(selectedCrypto) {
        document.querySelectorAll('.crypto-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.crypto === selectedCrypto);
        });
    }
}