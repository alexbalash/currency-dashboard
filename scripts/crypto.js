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

function getBtc(start, end, id) {
	return webix.ajax().headers({
			'X-CoinAPI-Key': '0C407186-3F3A-4C34-83E7-8E4ABC08CE18'
		}).get(`https://rest.coinapi.io/v1/exchangerate/${id}/USD/history?period_id=1DAY&time_start=${end}T00:00:00&time_end=${start}T00:00:00`)
		.then(datas => {
			var jsons = datas.json();
			const obj = {
				...jsons,
				data: start_date_btc
			};
			setToCacheCrypto(BTCRate, obj, id);
		})
		.catch(err => {
			webix.message("BTC: Server side error, see console", "error");
		});
}
getBtc(start_date_btc, end_date, "BTC")
getBtc(start_date_btc, end_date, "ETH")
getBtc(start_date_btc, end_date, "USDT")
getBtc(start_date_btc, end_date, "BNB")

function getCurrentCrypto(id) {
	return webix.ajax().headers({
			'X-CoinAPI-Key': '0C407186-3F3A-4C34-83E7-8E4ABC08CE18'
		}).get(`https://rest.coinapi.io/v1/exchangerate/${id}/USD`)
		.then(datas => {
			var jsons = datas.json();

			jsons.rate = +jsons.rate.toFixed(3)
			const obj = {
				...jsons,
				data: start_date_btc
			};
		
			setToCacheCrypto(cryptoToday, obj, id);
		})
		.catch(err => {
			webix.message("BTC: Server side error, see console", "error");
		});
}
getCurrentCrypto("BTC")
getCurrentCrypto("ETH")
getCurrentCrypto("USDT")
getCurrentCrypto("BNB")


const BTCRate = new webix.DataCollection({
	data: webix.storage.session.get("BTCrate-data") || []
});

BTCRate.attachEvent("onAfterAdd", function() {
	webix.storage.session.put("BTCrate-data", this.serialize());
});

const cryptoToday = new webix.DataCollection({
	data: webix.storage.session.get("cryptoToday-data") || []
});

cryptoToday.attachEvent("onAfterAdd", function() {
	webix.storage.session.put("cryptoToday-data", this.serialize());
});

function setToCacheCrypto(storage, data, id) {
	storage.add({
		...data,
		id: id
	});
}

const cacheBTC = BTCRate.getItem("BTC");
const cacheETH = BTCRate.getItem("ETH");
const cacheUSDT = BTCRate.getItem("USDT");
const cacheBNB = BTCRate.getItem("BNB");
const todayBTC = cryptoToday.getItem("BTC");
const todayETH = cryptoToday.getItem("ETH");
const todayUSDT = cryptoToday.getItem("USDT");
const todayBNB = cryptoToday.getItem("BNB");


const removeProps = (...propsToFilter) => obj => {
	const newObj = Object.assign({}, obj);
	propsToFilter.forEach(key => delete newObj[key]);
	return newObj;
};

let BTC_clean = removeProps('data', 'id')(cacheBTC);
let ETH_clean = removeProps('data', 'id')(cacheETH);
let USDT_clean = removeProps('data', 'id')(cacheUSDT);
let BNB_clean = removeProps('data', 'id')(cacheBNB);
var myformat = webix.Date.dateToStr("%m - %d");

function time(array) {
	for (let date in array) {
		let string = new Date(array[date]["time_period_start"])
		array[date]["time_period_start"] = myformat(string)
	}
	const arrayOfObjects = Object.values(array);
	return arrayOfObjects
}

let clean = time(BTC_clean)
let cleanETH = time(ETH_clean)
let cleanUSDT = time(USDT_clean)
let cleanBNB = time(BNB_clean)

let compare = function(cache1, cache2){
	let yesterday = cache1[9].rate_close
	let yesterdayValue =  cache1 === "cacheUSDT" ? + yesterday.toFixed(3): yesterday
  	let today = cache2.rate
	let arrow = today > yesterdayValue ? "top" : "bottom"
  return arrow
}
let arrow_destination_btc = compare(cacheBTC, todayBTC);
let arrow_destination_eth = compare(cacheETH, todayETH);
let arrow_destination_usdt = compare(cacheUSDT, todayUSDT);
let arrow_destination_bnb = compare(cacheBNB, todayBNB);

const USDT_panel = {
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
        data: cleanUSDT,
        value: "#rate_close#",
        xAxis: {
            template: "#time_period_start#"
        },
        yAxis: {},
      tooltip: "#rate_close#"
    }
}

const BNB_panel = {
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
        data: cleanBNB,
        value: "#rate_close#",
        xAxis: {
            template: "#time_period_start#"
        },
        yAxis: {},
      tooltip: "#rate_close#"
    }
}

const ETH_panel = {
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
        data: cleanETH,
        value: "#rate_close#",
        xAxis: {
            template: "#time_period_start#"
        },
        yAxis: {},
      tooltip: "#rate_close#"
    }
}

const BTC_panel = {
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
        data: clean,
        value: "#rate_close#",
        xAxis: {
            template: "#time_period_start#"
        },
        yAxis: {},
        tooltip: "#rate_close#"

    }
}

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
        type: {
            templateStart: "<div>",
            template: `	<div class="currencyName">BTC</div>
                           <div class="flex"><div>${todayBTC.rate}</div> <span class="mdi mdi-arrow-${arrow_destination_btc}-right"></span></div>
                           <div class="currencyName">ETH</div>
                        <div class="flex"><div>${todayETH.rate}</div> <span class="mdi mdi-arrow-${arrow_destination_eth}-right"></span></div>
                        <div class="currencyName">USDT</div>
                        <div class="flex"><div>${todayUSDT.rate}</div> <span class="mdi mdi-arrow-${arrow_destination_usdt}-right"></span></div>
                        <div class="currencyName">BNB</div>
                        <div class="flex"><div>${todayBNB.rate}</div> <span class="mdi mdi-arrow-${arrow_destination_bnb}-right"></span></div>`,
            templateEnd: "</div>"
        },
        data: todayBTC
    }
}

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
        elements: [{
            rows: [{
                    view: "text",
                    id: "text1",
                    type: "number",
              
                    value: 1,
                    on: {
                        onChange: function(newValue, oldValue, config) {
                            let num = $$("select").getValue();
                            switch (num) {
                                case '1':
                                    $$("text").setValue(todayBTC.rate * newValue)
                                    break
                                case '2':
                                    $$("text").setValue(todayETH.rate * newValue)
                                    break
                                case '3':
                                    $$("text").setValue(todayUSDT.rate * newValue)
                                    break
                                case '4':
                                    $$("text").setValue(todayBNB.rate * newValue)
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
                            value: "BTC"
                        },
                        {
                            id: 2,
                            value: "ETH"
                        },
                        {
                            id: 3,
                            value: "USDT"
                        },
                              {
                            id: 4,
                            value: "BNB"
                        }
                    ],
                    on: {
                        onChange: function(newValue, oldValue, config) {
                          
                            let num = $$("text1").getValue()
                            switch (newValue) {
                                case '1':
                                    $$("text").setValue(todayBTC.rate * num)
                                    break
                                case '2':
                                    $$("text").setValue(todayETH.rate * num)
                                    break
                                case '3':
                                    $$("text").setValue(todayUSDT.rate * num)
                                    break
                                case '4':
                                    $$("text").setValue(todayBNB.rate * num)
                                    break

                            }
                        }
                    }

                },
                {
                    view: "text",
                    id: "text",
                    type: "number",
                    value: todayBTC.rate,
                  
                }

            ]
        }]
    }
}

const cryptogrid = {
	view: "dashboard",
	id: "regulargrid",
	gridColumns: 3,
	gridRows: 2,
	cellHeight: 200,
	cellWidth: 180,
	cells: [
        USDT_panel,
		crypto_list_panel,
		BNB_panel,
		ETH_panel,
		BTC_panel,
		crypto_converter_panel
	]
};

webix.ready(function() {
	webix.ui({
		rows: [
			toolbar, {
				view: "scrollview",
				scroll: "xy",
				body: cryptogrid
			}
		]
	});
	webix.ui(sidemenu);
});