/// <reference path="../GeneratedArtifacts/viewModel.js" />

myapp.Reports.ScreenContent_render = function (element, contentItem) {
    $(function () {
        viewer = GrapeCity.ActiveReports.Viewer({
            element: element,
            reportService: {
                url: 'CodeBasedReport.asmx'
            },
            uiType: 'desktop',
            documentLoaded: function () {
                arls.adjustScroll(element);
            }
        });

        var reportOption = {
            id: "LightSwitchApplication.Reports.CodeBasedReport"
        };

        // TODO: If you are using LightSwitch screen properties to parameterize reports
        //       without showing end-users the Parameters tab of the ActiveReports viewer
        //       control, uncomment the following line and modify it to use the correct
        //       screen property name. Note that the name of the cookie used here must
        //       match the name used in the constructor of the CodeBasedReport class in
        //       the Server project.
        //
        // document.cookie = "categoryID=" + contentItem.screen.CategoryID.toString();

        viewer.option('report', reportOption);
    });
};
