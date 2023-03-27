// caches to store data to avoid repetitive calls
const BTCRate = new webix.DataCollection({
	data: webix.storage.session.get("BTCrate-data") || [],
    on:{
		"onAfterAdd": function() {
		    webix.storage.session.put("BTCrate-data", this.serialize());
		}
    }
});
const cryptoToday = new webix.DataCollection({
	data: webix.storage.session.get("cryptoToday-data") || [],
    on:{
		"onAfterAdd": function() {
		    webix.storage.session.put("cryptoToday-data", this.serialize());
		}
    }
});
function setToCacheCrypto(storage, data, id) {
	storage.add({
		...data,
		id: id
	});
}

function getBtc(id, start, end) {
    return webix.ajax().headers({
			'X-CoinAPI-Key': '0C407186-3F3A-4C34-83E7-8E4ABC08CE18'
		}).get(`https://rest.coinapi.io/v1/exchangerate/${id}/USD/history?period_id=1DAY&time_start=${start}&time_end=${end}`)
		.then(data => {
			const json = data.json();
			const obj = {
				...json,
				date: new Date()
			};
			setToCacheCrypto(BTCRate, obj, id);
		})
		.catch(err => {
			webix.message("BTC: Server side error, see console", "error");
		    console.log(err);
		});
}

function getCurrentCrypto(id) {
	return webix.ajax().headers({
			'X-CoinAPI-Key': '0C407186-3F3A-4C34-83E7-8E4ABC08CE18'
		}).get(`https://rest.coinapi.io/v1/exchangerate/${id}/USD`)
		.then(data => {
			const json = data.json();
			json.rate = +json.rate.toFixed(3)
			const obj = {
				...json,
				date: new Date()
			};
		
			setToCacheCrypto(cryptoToday, obj, id);
		})
		.catch(err => {
			webix.message("BTC: Server side error, see console", "error");
		    console.log(err);
		});
}

const removeProps = (...propsToFilter) => obj => {
	const newObj = Object.assign({}, obj);
	propsToFilter.forEach(key => delete newObj[key]);
	return newObj;
};

const myformat = webix.Date.dateToStr("%m - %d");
function time(array) {
	for (let date in array) {
		let string = new Date(array[date]["time_period_start"])
		array[date]["time_period_start"] = myformat(string)
	}
	const arrayOfObjects = Object.values(array);
	return arrayOfObjects
}

let compare = function(cache1, cache2){
	let yesterday = cache1[9].rate_close // [fixme] what is this magic number 9?
	let yesterdayValue = cache1 === "cacheUSDT" ? + yesterday.toFixed(3): yesterday
  	let today = cache2.rate
	let arrow = today > yesterdayValue ? "top" : "bottom"
    return arrow
}

const currencies = ["BTC", "ETC", "USDT", "BNB"];
const cacheCurrencies = {};
const todayCurrencies = {};
const cleanCrypto = {};
const cleanCurrencies = {};
const arrowDestination = {};
const listData = [];

function iterateAsync(arr, code, ctx) {
	ctx = ctx || 0;
	if (ctx >= arr.length) return;
	return code(arr[ctx], ctx).then(() => {
		ctx += 1;
		return iterateAsync(arr, code, ctx);
	});
}

iterateAsync(currencies, c => {
    const now = webix.Date.dayStart(new Date());
    const start = webix.Date.add(now, -1, "day", true).toISOString();
    const end = now.toISOString();

    return webix.promise.all([
		getBtc(c, start, end),
		getCurrentCrypto(c)
    ]).then(() => {
		cacheCurrencies[c] = BTCRate.getItem(c);
		todayCurrencies[c] = cryptoToday.getItem(c);
		cleanCrypto[c] = removeProps('date', 'id')(cacheCurrencies[c]);
		cleanCurrencies[c] = time(cleanCrypto[c]);
		arrowDestination[c] = compare(cacheCurrencies[c], todayCurrencies[c]);

		listData.push({ id: c, name: c, rate: todayCurrencies[c], direction: arrowDestination[c] });
    });
}).then(() => {
    // todo: parse all data where it should be
});

// UI components

const crypto_list_panel = {
    view: "panel",
    x: 0,
    y: 1,
    dx: 1,
    dy: 1,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
		view: "list",
		id: "listOfRateChange",
		template: obj => 
		    `<div class="currencyName">${obj.id}</div>
		    <div class="flex"><div>${obj.rate}</div>
				<span class="mdi mdi-arrow-${obj.direction}-right"></span>
		    </div>`,
    }
};
// [todo] parse today data for all currencies

const crypto_converter_panel = {
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
				    onChange: amount => {
						const currency = $$("select").getValue();
						$$("resultAmount").setValue(todayCurrencies[currency] * amount);
				    }
				}
		    },
		    {
				view: "richselect",
				id: "select",
				value: "BTC",
				options: currencies,
				on: {
				    onChange: currency => {
						const amount = $$("amount").getValue();
						$$("resultAmount").setValue(todayCurrencies[currency] * amount);
				    }
				}
		    },
		    {
				view: "text",
				id: "resultAmount",
				type: "number",
				value: todayCurrencies["BTC"],
				readonly: true,
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
				template: "#time_period_start#"
		    },
		    yAxis: {},
		    tooltip: "#rate_close#"
		}
    };
}

const cells = [
    { x: 1, y: 0, dx: 3, dy: 2 },
    { x: 4, y: 0, dx: 3, dy: 2 },
    { x: 1, y: 2, dx: 3, dy: 2 },
    { x: 4, y: 2, dx: 3, dy: 2 }
];

const cryptogrid = {
	view: "dashboard",
	id: "regulargrid",
	gridColumns: 3,
	gridRows: 2,
	cellHeight: 200,
	cellWidth: 180,
	cells: [
		crypto_list_panel,
		crypto_converter_panel,
		...cells.map(cell => getPanel(cell)),
		// [todo] parse clean dataset
	]
};
