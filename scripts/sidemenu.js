const sidemenu = {
	view: "sidemenu",
	id: "menu",
	width: 200,
	position: "left",
	state: state => {
		const toolbarHeight = $$("toolbar").$height;
		state.top = toolbarHeight;
		state.height -= toolbarHeight;
	},
	body: {
		view: "list",
		borderless: true,
		scroll: false,
		template: "<span class='webix_icon mdi mdi-#icon#'></span>#value#",
		data: [
			{
				id: "regulargrid",
				value: "Regular",
			},
			{
				id: "cryptogrid",
				value: "Crypto",
			},
		],
		select: true,
		type: {
			height: 40
		},
		on: {
			onAfterSelect: id => $$("cells").setValue(id)
		}
	}
}