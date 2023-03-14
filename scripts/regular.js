var sidemenu = {
	view: "sidemenu",
	id: "menu",
	width: 200,
	position: "left",
	state: function(state) {
		var toolbarHeight = $$("toolbar").$height;
		state.top = toolbarHeight;
		state.height -= toolbarHeight;
	},
	body: {
		view: "list",
		borderless: true,
		scroll: false,
		template: "<span class='webix_icon mdi mdi-#icon#'></span> #value#",
		data: [{
				id: 1,
				value: "Regular",
			},
			{
				id: 2,
				value: "Crypto",
			},

		],
		select: true,
		type: {
			height: 40
		}
	}
}

var toolbar = {
	view: "toolbar",
	id: "toolbar",
	elements: [{
			view: "icon",
			icon: "mdi mdi-menu",
			click: function() {
				if ($$("menu").config.hidden) {
					$$("menu").show();
				} else
					$$("menu").hide();
			}
		},
		{
			view: "label",
			label: "Currency Dashboard"
		}
	]
}


var format_api_date = webix.Date.dateToStr("%Y-%m-%d");

function dateRange() {
	const now = webix.Date.dayStart(new Date());
	const end = webix.Date.add(now, -1, "day", true)
	const start = webix.Date.add(now, -10, "day", true);
	let start_date_btc = format_api_date(now)
	let start_date = format_api_date(end)
	let end_date = format_api_date(start)
	return {
		start_date_btc,
		start_date,
		end_date
	}
}

let {
	start_date_btc,
	start_date,
	end_date
} = dateRange();

const apiKey = "nPhiDvmqv4cvRyesDqfd7ukYeyg2bUgbgo0BUT0o"

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
function getCurrenciesHistorical(key, start, end, currency) {
    let cache_exist = historyRate.getItem("EUR")
    if (cache_exist) {
        return webix.promise.resolve(historyRate);
      } else 
	return webix.ajax()
		.get(`https://api.freecurrencyapi.com/v1/historical?apikey=${key}&currencies=USD&base_currency=${currency}&date_from=${end}T00:00:00&date_to=${start}T00:00:00`)
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
		.get(`https://api.freecurrencyapi.com/v1/latest?apikey=${key}&currencies=USD&base_currency=${currency}`)

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

let CAD = []
let EUR = []
let GBP = []
let PLN = []
const currencies = ["EUR", "CAD", "GBP", "PLN"];
currencies.forEach(c => getCurrenciesHistorical(apiKey, start_date, end_date, c));
currencies.forEach(c => getCurrencies(apiKey, c));
/*
if (todayRate && historyRate) {
  
  } else {

    webix.promise.all([
getCurrenciesHistorical(apiKey, start_date, end_date, "EUR"),
getCurrenciesHistorical(apiKey, start_date, end_date, "CAD"),
getCurrenciesHistorical(apiKey, start_date, end_date, "GBP"),
getCurrenciesHistorical(apiKey, start_date, end_date, "PLN"),

getCurrencies(apiKey, "EUR"),
getCurrencies(apiKey, "CAD"),
getCurrencies(apiKey, "GBP"),
getCurrencies(apiKey, "PLN"),
    ]).then(data => {
  console.log(data)
    });
  }
*/
const cache = {};
currencies.forEach(currency => {
  cache[currency] = todayRate.getItem(currency);
});

const cache_history = {}
currencies.forEach(currency => {
    cache_history[currency] = historyRate.getItem(currency);
  });

const removeProps = (...propsToFilter) => obj => {
	const newObj = Object.assign({}, obj);
	propsToFilter.forEach(key => delete newObj[key]);
	return newObj;
};

const history_clean = {}
currencies.forEach(currency => {
    history_clean[currency] = removeProps('currency', 'id')(cache_history[currency]);
  });

function createChartData(history, currencyName, arrayName) {
	for (let date in history) {
		let newObj = {};
		newObj.date = date.substring(5);
		newObj[currencyName] = history[date].USD;
		arrayName.push(newObj);
	}
    
}

var myformat = webix.Date.dateToStr("%m - %d");
let compare_regular = function(cache1, cache2, currency) {
	console.log(cache1)
    let yesterday = cache1[8][currency]
	let today = cache2["USD"]
	let arrow = today > yesterday ? "top" : "bottom"
	return arrow
}

currencies.forEach(currency => {
  switch (currency) {
    case 'CAD':
      arr = CAD;
      break;
    case 'EUR':
      arr = EUR;
      break;
    case 'GBP':
      arr = GBP;
      break;
    case 'PLN':
      arr = PLN;
      break;
  }
  createChartData(history_clean[currency], currency, arr)
  cache[currency]["arrow"] = compare_regular(arr, cache[currency], currency)
});


const CAD_panel = {
    view: "panel",
    x: 1,
    y: 2,
    dx: 3,
    dy: 2,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "chart",
        type: "line",
        data: CAD,
        value: "#CAD#",
        xAxis: {
            template: "#date#"
        },
        yAxis: {},
      tooltip:"#CAD#"
    }
}

const EUR_panel = {
    view: "panel",
    x: 1,
    y: 0,
    dx: 3,
    dy: 2,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "chart",
        type: "line",
        data: EUR,
        value: "#EUR#",
        xAxis: {
            template: "#date#"
        },
        yAxis: {},
        tooltip: "#EUR#"
    }
}

const GBP_panel = {
    view: "panel",
    x: 4,
    y: 0,
    dx: 3,
    dy: 2,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "chart",
        type: "line",
        data: GBP,
        value: "#GBP#",
        xAxis: {
            template: "#date#"
        },
        yAxis: {},
      tooltip:"#GBP#"
    }
}

const PLN_panel = {
    view: "panel",
    x: 4,
    y: 2,
    dx: 3,
    dy: 2,
    resize: true,
    css: "panel_drag_view",
    icon: false,
    body: {
        view: "chart",
        type: "line",
        data: PLN,
        value: "#PLN#",
        xAxis: {
            template: "#date#"
        },
        yAxis: {},
      tooltip:"#PLN#"
    }
}

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
            template: `	<div class="currencyName"> #currency# </div>
                           <div class="flex"><div> #USD# </div> <span class="mdi mdi-arrow-#arrow#-right"></span></div>`,
            templateEnd: "</div>"
        },
        data: arrayOfObjects
    }
}


const currency_converter_panel = 	{
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
        elements: [{
            rows: [{
                    view: "text",
                    id: "text1",
                    type: "number",
                    value: 1,
                    on: {
                        onChange: function(newValue, oldValue, config) {

                            let num = $$("select").getValue()

                            switch (num) {
                                case '1':
                                    $$("text").setValue(cache["CAD"]["USD"] * newValue)
                                    break
                                case '2':
                                    $$("text").setValue(cache["EUR"]["USD"] * newValue)
                                    break
                                case '3':
                                    $$("text").setValue(cache["GBP"]["USD"] * newValue)
                                    break
                                case '4':
                                    $$("text").setValue(cache["PLN"]["USD"] * newValue)
                                    break
                            }
                        }
                    }
                },
                {
                    view: "richselect",
                    id: "select",
                    value: 1,
                    options: [{
                            id: 1,
                            value: "CAD"
                        },
                        {
                            id: 2,
                            value: "EUR"
                        },
                        {
                            id: 3,
                            value: "GBP"
                        },
                        {
                            id: 4,
                            value: "PLN"
                        }
                    ],
                    on: {
                        onChange: function(newValue, oldValue, config) {

                            let num = $$("text1").getValue()
                            switch (newValue) {
                                case '1':
                                    $$("text").setValue(cache["CAD"]["USD"] * num)
                                    break
                                case '2':
                                    $$("text").setValue(cache["EUR"]["USD"] * num)
                                    break
                                case '3':
                                    $$("text").setValue(cache["GBP"]["USD"] * num)
                                    break
                                case '4':
                                    $$("text").setValue(cache["PLN"]["USD"] * num)
                                    break
                            }
                        }
                    }
                },
                {
                    view: "text",
                    id: "text",
                    type: "number",
                    value: cache["CAD"]["USD"]
                }

            ]
        }]
    }
}

const regulargrid = {
	view: "dashboard",
	id: "regulargrid",
	gridColumns: 3,
	gridRows: 2,
	cellHeight: 200,
	cellWidth: 180,
	cells: [
		EUR_panel,
        list_panel,
        GBP_panel,
		CAD_panel,
		PLN_panel,
        currency_converter_panel
	]
};

webix.ready(function() {
	webix.ui({
		rows: [
			toolbar, {
				view: "scrollview",
				scroll: "xy",
				body: regulargrid
			}
		]
	});
	webix.ui(sidemenu);

});