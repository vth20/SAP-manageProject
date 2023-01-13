sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "manageproduct/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/m/library",
    'sap/viz/ui5/data/FlattenedDataset', 
    'sap/viz/ui5/controls/common/feeds/FeedItem'

],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, MessageBox, models, Filter, FilterOperator, JSONModel, Export, ExportTypeCSV, mobileLibrary, FlattenedDataset, FeedItem) {
        "use strict";

        return Controller.extend("manageproduct.controller.Main", {

            onInit: function () {
                this._initDataModel();
                this.setSuggestionSupplies();
                this.setDropdownContries();
            },
            /**
            *  Initialize Data Model
            */
            _initDataModel: async function () {
                var oView = this.getView();
                oView.setModel(models.createMainScreenModel(), "screen");
                oView.setModel(models.createSuggestionModel(), "suggestion");
                oView.setModel(models.createDropdownModel(), "dropdown");
                oView.setModel(models.createSpotsModel(), "spots");
                this._setSpotsModel();
                // console.log(this.getOwnerComponent().getModel("spotsModel").getData());
                console.log(this.getOwnerComponent().getModel("data"));
                //model for i18n
                this.oBundle = this.getOwnerComponent()
                    .getModel("i18n")
                    .getResourceBundle();
            },
            onGenericTagPress: function (oEvent) {
                let oView = this.getView();
                let oSourceControl = oEvent.getSource();
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "manageproduct.view.Card"
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    }).catch(() => {
                        MessageBox.show(this.oBundle.getText("WarningContent"), {
                            icon: MessageBox.Icon.WARNING,
                            title: this.oBundle.getText("WarningTitle"),
                            description: this.oBundle.getText("WarningContent"),
                            subtitle: this.oBundle.getText("WarningTitle"),
                        });
                    });
                }

                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oSourceControl);
                });
            },
            // ========================================= GET =========================================
            /**
             * Get OData model for get oData
             */
            _getOdataModel: function () {
                return this.getOwnerComponent().getModel();
            },

            /**
            * Get Screen model
            */
            _getScreenModel: function () {
                return this.getView().getModel("screen");
            },

            /**
            * Get Suggestion model
            */
            _getSuggestionModel: function () {
                return this.getView().getModel("suggestion");
            },

            /**
            * Get Suggestion model
            */
            _getDropdownModel: function () {
                return this.getView().getModel("dropdown");
            },

            /**
            * Get Spots model
            */
            _getSpotsModel: function () {
                return this.getView().getModel("spots");
            },

            /**
            * Get Table VendorList model
            */
            _getTableModel: function () {
                return this.getView().getModel("productData");
            },
            // =======================================================================================

            // ========================================= SET =========================================

            /**
             * Set data vendorList for table
             * @param {*} oRetrievedResult 
             */
            _setODataTable: function (oRetrievedResult) {
                this.getView().setModel(new JSONModel(oRetrievedResult.results), "productData");
            },

            /**
             * Set suggestion model for filter
             * @param {*} oRetrievedResult 
             */
            _setSuggestionModel: function (oRetrievedResult) {
                this.getView().setModel(new JSONModel(oRetrievedResult.results), "suggestion");
            },

            /**
             * Set suggestion model for filter
             * @param {*} oRetrievedResult 
             */
            _setDropdownModel: function (oRetrievedResult) {
                this.getView().setModel(new JSONModel(oRetrievedResult.results), "dropdown");
            },
            _setSpotsModel: function() {
                const oSpotsModel = this.getOwnerComponent().getModel("spotsModel");
                this.getView().setModel(oSpotsModel, "spots");
            },
            // =======================================================================================

            /**
             * Event handling when Clear button pressed
             */
            onPressClearButton: function () {
                var oScreenModel = this._getScreenModel();
                oScreenModel.setProperty("/supplier", "");
                oScreenModel.setProperty("/Country", "");
                oScreenModel.setProperty("/search", "");
            },

            /**
             * Event handling when Search button pressed
             */
            onPressSearchButton: function () {
                //get filters from screen
                this._getFilters()
                    //retrieve data
                    .then(this._readOData.bind(this))
                    //set retrieved data to screen
                    .then(this._setResult.bind(this))
                    .catch((err) => {
                        console.log(err);
                    })
            },

            /**
             * Get filter from filterbar
             * @returns promise
             */
            _getFilters: function () {
                var aMessages = [];
                var oFilter = this._getScreenModel().getData();
                console.log(oFilter);
                var aFilters = [];
                if (oFilter.supplier) {
                    aFilters.push(new Filter("Supplier/CompanyName", FilterOperator.EQ, oFilter.supplier));
                }
                if (oFilter.Country) {
                    aFilters.push(new Filter("Supplier/Country", FilterOperator.EQ, oFilter.Country));
                }
                console.log(aFilters);
                return Promise.resolve(aFilters);
            },
            /**
             * @param {*} aFilters 
             * @returns promise
             */
            _readOData: function (aFilters) {
                return new Promise(
                    function (fResolve, fReject) {
                        this._getOdataModel().read("/Products", {
                            filters: aFilters,
                            urlParameters: {
                                "$expand": "Supplier",
                                "$select": "ProductID,ProductName,UnitPrice,Supplier/CompanyName,Supplier/ContactName, Supplier/Address, Supplier/City, Supplier/Country, Supplier/PostalCode, Supplier/ContactTitle, Supplier/Phone",
                            },
                            success: function (oData) {
                                fResolve(oData);
                            },
                            error: function (oError) {
                                var aMessages = [
                                    {
                                        type: "Error",
                                        title: oError.message,
                                        description: oError.message,
                                        subtitle: oError.message,
                                        counter: 1,
                                    },
                                ];
                                fReject(aMessages);
                            },
                        });
                    }.bind(this)
                );
            },
            /**
             * Set retrieved data to screen
             */
            _setResult: function (oData) {
                // set retrieved data to list
                console.log(oData);
                this._setODataTable(oData);
                console.log(oData.results.length);
                // set record lines value to list header
                this._getScreenModel().setProperty("/RowCount", oData.results.length);
                console.log(this._getScreenModel().getData());
                return Promise.resolve();
            },

            setSuggestionSupplies: function () {
                const _this = this;
                this._getOdataModel().read("/Products", {
                    urlParameters: {
                        "$expand": "Supplier",
                        "$select": "ProductName, Supplier/CompanyName,",
                    },
                    success: function (oData) {
                        _this._setSuggestionModel(oData);
                    },
                });
            },

            setDropdownContries: function () {
                const _this = this;
                this._getOdataModel().read("/Suppliers", {
                    urlParameters: {
                        "$select": "Country",
                    },
                    success: function (oData) {
                        console.log(oData);
                        _this._setDropdownModel(oData);
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            },

            onShow: function () {
                console.log(this._getSuggestionModel().getData());
            },
            onShow1: function () {
                // console.log(this.getView().getModel("productData").getData());
                console.log(this._getTableModel().getData());
                console.log(this._getSpotsModel().getData());
            },



            _getSearchField: function () {
                var oFilter = this._getScreenModel().getData();
                console.log(oFilter);
                var aFilters = [];
                if (oFilter.search) {
                    aFilters.push(new Filter({
                        filters: [
                            new Filter("Supplier/ContactName", FilterOperator.Contains, oFilter.search),
                            new Filter("Supplier/ContactTitle", FilterOperator.Contains, oFilter.search),
                            new Filter("Supplier/Phone", FilterOperator.Contains, oFilter.search),
                            new Filter("Supplier/PostalCode", FilterOperator.Contains, oFilter.search),
                        ],
                        and: false,
                    }))
                }
                return Promise.resolve(aFilters);
            },

            onPressSearchField: function () {
                this._getSearchField()
                    .then(this._readOData.bind(this))
                    //set retrieved data to screen
                    .then(this._setResult.bind(this))
                    .catch((err) => {
                        console.log(err);
                    })
            },

            /**
             * Download file
             */
            _exportFile: function (aFilters) {
                console.log(aFilters);
                return new Promise(function (fResolve, fReject) {
                    var aMessages = [];
                    console.log(aFilters);
                    var oExport = new Export({

                        // type that will be used to generate the content.
                        exportType: new ExportTypeCSV({
                            separatorChar: ","
                        }),

                        // pass in the model created above
                        models: this._getOdataModel(),

                        // binding information for the rows aggregation
                        rows: {
                            path: "/Products",
                            filters: aFilters,
                            // urlParameters: {
                            //     "$expand": "Supplier",
                            //     "$select": "ProductID,ProductName,UnitPrice,Supplier/CompanyName,Supplier/ContactName, Supplier/Address, Supplier/City, Supplier/Country, Supplier/PostalCode, Supplier/ContactTitle, Supplier/Phone",
                            // },
                        },

                        // column definitions with column name and binding info for the content
                        columns: [{
                            name: this.oBundle.getText("headerID"),
                            template: {
                                content: "{ProductID}"
                            }
                        }, {
                            name: this.oBundle.getText("headerName"),
                            template: {
                                content: "{ProductName}"
                            }
                        }, {
                            name: this.oBundle.getText("headerPrice"),
                            template: {
                                content: "{UnitPrice}"
                            }
                        }, {
                            name: this.oBundle.getText("headerCompany"),
                            template: {
                                content: "{Supplier/CompanyName}"
                            }
                        }, {
                            name: this.oBundle.getText("headerContact"),
                            template: {
                                content: "{Supplier/ContactName}"
                            }
                        }, {
                            name: this.oBundle.getText("headerAddress"),
                            template: {
                                content: "{Supplier/Address}, {Supplier/City}, {Supplier/Country}"
                            }
                        }, {
                            name: this.oBundle.getText("headerPostal"),
                            template: {
                                content: "{Supplier/PostalCode}"
                            }
                        }, {
                            name: this.oBundle.getText("headerContactName"),
                            template: {
                                content: "{Supplier/ContactName}"
                            }
                        }, {
                            name: this.oBundle.getText("headerContactTitle"),
                            template: {
                                content: "{Supplier/ContactTitle}"
                            }
                        }, {
                            name: this.oBundle.getText("headerPhone"),
                            template: {
                                content: "{Supplier/Phone}"
                            }
                        }
                        ]
                    });
                    console.log(oExport);
                    // download file
                    oExport.saveFile()
                        .then(function () {
                            console.log('then');
                            fResolve();
                        })
                        .catch(function (oError) {
                            console.log(oError);
                            fReject(aMessages);
                        }.bind(this))
                        .finally(function () {
                            console.log('done');
                            oExport.destroy();
                        }.bind(this));
                }.bind(this));
            },
            onPressExportButton: function () {
                //get filters from screen
                this._getFilters()
                    //retrieve data
                    .then(this._exportFile.bind(this))
                    .catch(err => console.log(err))
            },
            onNotifyUserPress: function (oEvent) {
                const URLHelper = mobileLibrary.URLHelper;
                URLHelper.triggerEmail('abc@gmail.com', "Info Request", false, false, false, true);
            },
            onSelectionChange: function (oEvt) {
                const oModel = this._getSpotsModel()
                var oList = oEvt.getSource();
                var aItems = oList.getSelectedItems();
                for (var j = 0; j < 3; j++) {// loop over first 3 locations in Data.json
                    var locJson = oModel.getProperty("/Spots/" + j + "/tooltip"); // location from Data.json
                    var flagScaled = false;
                    for (var i = 0; i < aItems.length; i++) {// loop over all selected locations
                        var locList = aItems[i].getTitle();
                        if (locList == locJson) {
                            if (oModel.getProperty("/Spots/" + j + "/scale") == "1;1;1") {
                                oModel.setProperty("/Spots/" + j + "/scale", "1.5;1.5;1.5");
                                flagScaled = true;
                            }
                            else if (oModel.getProperty("/Spots/" + j + "/scale") == "1.5;1.5;1.5") {
                                flagScaled = true;
                            }
                        }
                        continue;
                    }
                    if (!flagScaled) {
                        if (oModel.getProperty("/Spots/" + j + "/scale") == "1.5;1.5;1.5") {
                            oModel.setProperty("/Spots/" + j + "/scale", "1;1;1");
                        }
                    }
                }
            },

            // _constants: {
            //     vizFrame: {
            //         id: "chartContainerVizFrame",
            //         dataset: {
            //             dimensions: [{
            //                 name: 'Country',
            //                 value: "{Country}"
            //             }],
            //             measures: [{
            //                 group: 1,
            //                 name: 'Profit',
            //                 value: '{Revenue2}'
            //             }, {
            //                 group: 1,
            //                 name: 'Target',
            //                 value: '{Target}'
            //             }, {
            //                 group: 1,
            //                 name: "Forcast",
            //                 value: "{Forcast}"
            //             }, {
            //                 group: 1,
            //                 name: "Revenue",
            //                 value: "{Revenue}"
            //             },
            //                 {
            //                     group: 1,
            //                     name: 'Revenue2',
            //                     value: '{Revenue2}'
            //                 }, {
            //                     group: 1,
            //                     name: "Revenue3",
            //                     value: "{Revenue3}"
            //                 }],
            //             data: {
            //                 path: "/Products"
            //             }
            //         },
            //         type: "bar",
            //         properties: {
            //             plotArea: {
            //                 showGap: true
            //             }
            //         },
            //         feedItems: [{
            //             'uid': "primaryValues",
            //             'type': "Measure",
            //             'values': ["Revenue"]
            //         }, {
            //             'uid': "axisLabels",
            //             'type': "Dimension",
            //             'values': ["Country"]
            //         }, {
            //             'uid': "targetValues",
            //             'type': "Measure",
            //             'values': ["Target"]
            //         }]
            //     }
            // },
            _constants: {
                vizFrame: {
                    id: "chartContainerVizFrame",
                    dataset: {
                        dimensions: [{
                            name: 'ProductName',
                            value: "{ProductName}"
                        }],
                        measures: [{
                            group: 1,
                            name: 'ProductID',
                            value: '{ProductID}'
                        }, {
                            group: 1,
                            name: 'UnitsInStock',
                            value: '{UnitsInStock}'
                        }, {
                            group: 1,
                            name: "ReorderLevel",
                            value: "{ReorderLevel}"
                        },],
                        data: {
                            path: "/Products"
                        }
                    },
                    type: "line",
                    properties: {
                        plotArea: {
                            showGap: true
                        }
                    },
                    feedItems: [{
                        'uid': "primaryValues",
                        'type': "Measure",
                        'values': ["UnitsInStock"]
                    }, {
                        'uid': "axisLabels",
                        'type': "Dimension",
                        'values': ["ProductName"]
                    }, {
                        'uid': "targetValues",
                        'type': "Measure",
                        'values': ["ReorderLevel"]
                    }]
                }
            },

            _updateChartFrame: function(vizFrame) {
                const oVizFrame = this._constants.vizFrame;
                const oModel = new JSONModel({Products: this._getTableModel().getData()});
                // const oModel = this._getSpotsModel();
                console.log(oModel);
                console.log(oModel.getData());
                const oDataset = new FlattenedDataset(oVizFrame.dataset);
    
                vizFrame.setVizProperties(oVizFrame.properties);
                vizFrame.setDataset(oDataset);
                vizFrame.setModel(oModel);
                this._addFeedItems(vizFrame, oVizFrame.feedItems);
                vizFrame.setVizType(oVizFrame.type);
            },
            _addFeedItems: function(vizFrame, feedItems) {
                for (var i = 0; i < feedItems.length; i++) {
                    vizFrame.addFeed(new FeedItem(feedItems[i]));
                }
                console.log(vizFrame.getFeeds());
            },
            _initChartFrame: function() {
                var oVizFrame = this.getView().byId(this._constants.vizFrame.id);
			    this._updateChartFrame(oVizFrame);
            }
        });
    });
