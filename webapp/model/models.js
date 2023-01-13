sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            createMainScreenModel: function() {
                var oModel = new JSONModel({
                    "RowCount": 0,
                    "supplier": "",
                    "Product": "",
                    "Country": "",
                    "search": "",
                    "valueStatus": Math.random() * 2,
                    "editModel": true,
                    "HaveMessage": false,
                    "Messages": [],
                    "MessageCount": 0,
                    "MessageButtonType": "Default",
                    "MessageButtonIcon": "sap-icon://message-success"
                    });
                    oModel.setDefaultBindingMode("TwoWay");
                    return oModel;
    
            },
            /**
             *  Model for table
             */
             createDataModel: function () {
                var oModel = new JSONModel([]);
                oModel.setDefaultBindingMode("TwoWay");
                return oModel;
            },

            /**
             *  Model for suggestion
             */
             createSuggestionModel: function () {
                var oModel = new JSONModel([]);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            /**
             *  Model for suggestion
             */
             createDropdownModel: function () {
                var oModel = new JSONModel([]);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            /**
             *  Model for suggestion
             */
             createSpotsModel: function () {
                var oModel = new JSONModel([]);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
        };
    });