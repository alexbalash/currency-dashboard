const toolbar = {
	view: "toolbar",
	id: "toolbar",
	elements: [
        {
			view: "icon",
			icon: "mdi mdi-menu",
			click: function() {
				if ($$("menu").config.hidden) {
					$$("menu").show();
				} else {
					$$("menu").hide();
                }
			}
		},
		{
			view: "label",
			label: "Currency Dashboard"
		}
	]
}