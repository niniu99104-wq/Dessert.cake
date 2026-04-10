document.addEventListener("DOMContentLoaded", function() {
    // 設定日期邏輯：下單日 + 5 天
    const dateInput = document.getElementById('pickupDate');
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate; 
});

function toggleShipping() {
    const method = document.getElementById('method').value;
    // 根據選擇切換顯示區塊
    document.getElementById('pickupSection').classList.toggle('hidden', method !== 'pickup');
    document.getElementById('deliverySection').classList.toggle('hidden', method !== 'delivery');
    
    // 如果切換回自取，清空地址欄位，避免傳送錯誤資料
    if (method === 'pickup') {
        document.getElementById('address').value = '';
    }
    updateTotal();
}

function updateTotal() {
    const basePrice = parseInt(document.getElementById('size').value) || 0;
    const method = document.getElementById('method').value;
    let shipping = 0;

    if (method === 'delivery') {
        shipping = parseInt(document.getElementById('district').value);
        // 免運邏輯
        if (shipping === 60 && basePrice >= 1000) shipping = 0;
        if (shipping === 120 && basePrice >= 1500) shipping = 0;
    }

    const addon1 = document.getElementById('candle').checked ? 10 : 0;
    const addon2 = document.getElementById('cutlery').checked ? 20 : 0;
    
    // 計算商品總額與最終總額
    const productAmount = basePrice + addon1 + addon2;
    const total = productAmount + shipping;

    // 更新畫面顯示
    document.getElementById('shippingDisplay').innerText = shipping;
    document.getElementById('totalDisplay').innerText = total;
    
    // 將商品金額存入 form 的屬性中，方便送出時抓取
    document.getElementById('orderForm').dataset.productAmount = productAmount; 
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "訂單處理中...";
    submitBtn.disabled = true;

    // 取得尺寸文字 (例如 "8 吋生乳酪 ($960)")
    const sizeSelect = document.getElementById('size');
    const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text;

    // 準備傳送的 12 個欄位資料
    const formData = {
        orderDate: new Date().toLocaleDateString('zh-TW'),
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('method').value === 'pickup' ? document.getElementById('pickupTime').value : '無',
        method: document.getElementById('method').value === 'pickup' ? '自取' : '外送',
        flavor: document.getElementById('flavor').value,
        size: sizeText,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('method').value === 'pickup' ? '中西區大智街141號(自取)' : document.getElementById('address').value,
        productAmount: document.getElementById('orderForm').dataset.productAmount || 0,
        shippingFee: document.getElementById('shippingDisplay').innerText,
        total: document.getElementById('totalDisplay').innerText
    };

    // 💡 請將下方單引號內的網址替換為妳部署好的 Google Apps Script URL
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwTUlycJvviDm0bwcYrYx2Ecu-g1KBDk36n1dsDbLMdn-Sht17Q0AtB0Ff7mDxsLpN3/exec';

    fetch(scriptURL, { 
        method: 'POST', 
        body: JSON.stringify(formData) 
    })
    .then(res => {
        alert('訂單已收到！請留意後續付款通知。');
        window.location.reload(); // 成功後重整頁面
    })
    .catch(error => {
        alert('系統忙碌中，請直接截圖私訊 Line。');
        submitBtn.disabled = false;
        submitBtn.innerText = "確認下單";
    });
});
