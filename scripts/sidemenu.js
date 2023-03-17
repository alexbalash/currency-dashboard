const sidemenu = {
	view: "sidemenu",
	id: "menu",
	width: 200,
	position: "left",
	state: function(state) {
		const toolbarHeight = $$("toolbar").$height;
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