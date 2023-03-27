


const todayRate = new webix.DataCollection({
	data: webix.storage.session.get("rate-data") || []
});

todayRate.attachEvent("onAfterAdd", function() {
	webix.storage.session.put("rate-data", this.serialize());
});

function setToCache(data, date, currency) {
	todayRate.add({
		...data,
		id: currency,
		currency: currency,
		date: date
	});
}
const historyRate = new webix.DataCollection({
	data: webix.storage.session.get("history_rate-data") || []
});

historyRate.attachEvent("onAfterAdd", function() {
	webix.storage.session.put("history_rate-data", this.serialize());
});

function setToCacheHistory(data, date, currency) {
	historyRate.add({
		...data,
		id: currency,
		currency: currency,
		date: date
	});
}
function getCurrenciesHistorical(key, currency) {
    const now = webix.Date.dayStart(new Date());
	const end = webix.Date.add(now, -1, "day", true).toISOString()
	const start = webix.Date.add(now, -10, "day", true).toISOString();

    let cache_exist = historyRate.getItem("EUR")
    if (cache_exist) {
        return webix.promise.resolve(historyRate);
      } else 
	return webix.ajax()
		.get(`https://api.freecurrencyapi.com/v1/historical?apikey=${key}&currenciesC=USD&base_currency=${currency}&date_from=${start}&date_to=${end}`)
		.then(arr => {
			var arr1 = arr.json();
			var raw = arr1.data;
			const obj = {
				...raw,
				id: currency
			};
			setToCacheHistory(obj, end_date, currency);
		})
		.catch(err => {
			webix.message("CurrencyHistorical: Server side error, see console", "error");
		});
}

function getCurrencies(key, currency) {
    let cache_exist = todayRate.getItem("EUR")
    if (cache_exist) {
        return webix.promise.resolve(todayRate);
      } else 
	return webix.ajax()
		.get(`https://api.freecurrencyapi.com/v1/latest?apikey=${key}&currenciesC=USD&base_currency=${currency}`)

		.then(datas => {
			var jsons = datas.json();
			var raw = jsons.data;
			const obj = {
				...raw,
				date: format_api_date(new Date()),
				id: currency
			};
			setToCache(obj, format_api_date(new Date()), currency);
		})
		.catch(err => {
			webix.message("Server side error current, see console", "error");
		});
}

const removePropsC = (...propsToFilter) => obj => {
	const newObj = Object.assign({}, obj);
	propsToFilter.forEach(key => delete newObj[key]);
	return newObj;
};

function createChartData(history, currencyName) {
    const res = [];
	for (let date in history) {
		let newObj = {};
		newObj.date = date.substring(5);
		newObj[currencyName] = history[date].USD;
		res.push(newObj);
	}
    return res;
}

let compare_regular = (cache1, cache2, currency) => {
    let yesterday = cache1[8]?.[currency]
	let today = cache2?.["USD"]
	let arrow = today > yesterday ? "top" : "bottom"
	return arrow
};

const apiKey = "nPhiDvmqv4cvRyesDqfd7ukYeyg2bUgbgo0BUT0o";
const currenciesC = ["EUR", "CAD", "GBP", "PLN"];
const cache = {};
const cache_history = {};
const history_clean = {};
const chartData = {};
currenciesC.forEach(c => {
    getCurrenciesHistorical(apiKey, c);
    getCurrencies(apiKey, c);

    cache[c] = todayRate.getItem(c);
    cache_history[c] = historyRate.getItem(c);
    history_clean[c] = removePropsC('currency', 'id')(cache_history[c]);
    chartData[c] = createChartData(history_clean[c], c)
    if (cache[c]) cache[c]["arrow"] = compare_regular(chartData[c], cache[c], c)
});

const arrayOfObjects = Object.values(cache);

const list_panel = {
    view: "panel",
    x: 0,
    y: 1,
    dx: 1,
    dy: 2,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "list",
        type: {
            templateStart: "<div>",
            template: `	<div class="currencyName">#currency#</div>
                           <div class="flex"><div>#USD#</div> <span class="mdi mdi-arrow-#arrow#-right"></span></div>`,
            templateEnd: "</div>"
        },
        // data: arrayOfObjects
    }
};

const currency_converter_panel = {
    view: "panel",
    x: 0,
    y: 0,
    dx: 1,
    dy: 0,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "form",
        rows: [
            {
                view: "text",
                id: "amount",
                type: "number",
                value: 1,
                on: {
                    onChange: function(newValue) {
                        const cur = $$("select").getValue();
                        $$("resultAmount").setValue(cache[cur]["USD"] * newValue);
                    }
                }
            },
            {
                view: "richselect",
                id: "select",
                value: 1,
                options: currenciesC,
                on: {
                    onChange: function(newValue) {
                        const num = $$("amount").getValue();
                        $$("resultAmount").setValue(cache[newValue]["USD"] * num);
                    }
                }
            },
            {
                view: "text",
                id: "resultAmount",
                type: "number",
                // value: cache["CAD"]["USD"]
            }
        ]
    }
};

function getPanel(x, y, dx, dy, data){
    return {
        view: "panel",
        x,
        y,
        dx,
        dy,
        resize: true,
        css: "panel_drag_view",
        icon: false,
        body: {
            view: "chart",
            type: "line",
            data,
            value: "#rate_close#",
            xAxis: {
                template: "#date#" // !
            },
            yAxis: {},
            tooltip: "#rate_close#"
        }
    };
}

const cellsC = [
    { x: 1, y: 2, dx: 3, dy: 2 }, // CAD
    { x: 1, y: 0, dx: 3, dy: 2 }, // EUR
    { x: 4, y: 0, dx: 3, dy: 2 }, // GBP
    { x: 4, y: 2, dx: 3, dy: 2 } // USD
];

const regulargrid = {
	view: "dashboard",
	id: "regulargrid",
	gridColumns: 3,
	gridRows: 2,
	cellHeight: 200,
	cellWidth: 180,
	cells: [
        list_panel,
        currency_converter_panel,
        ...cellsC.map(cell => getPanel(cell)),
        // [todo] parse clean dataset
	]
};
