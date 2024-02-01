/** Initialize neccessary modules */
const EquipmentAdditionService = require('../services/Inventory/EquipmentAddition');
const EquipmentRemovalService = require('../services/Inventory/EquipmentRemoval');
const ModelAdditionService = require('../services/Inventory/ModelAddition');
const TypeAdditionService = require('../services/Inventory/TypeAddition');
const GetAllTypesService = require('../services/Inventory/GetAllTypes');
const GetAllModelsOfTypeService = require("../services/Inventory/GetAllModelsOfType");
const ModelsRemovalServices = require("../services/Inventory/ModelsRemoval");
const GetTypeInformationService = require("../services/Inventory/GetTypeInformation");
const GetModelInformationService = require("../services/Inventory/GetModelInformation");
const TypesRemovalServices = require("../services/Inventory/TypesRemoval");
const TypeUpdateServices = require("../services/Inventory/TypeUpdate");
const ModelUpdateServices = require("../services/Inventory/ModelUpdate");
const GetAllModelsServices = require("../services/Inventory/GetAllModels");
const GetAvailableModelsServices = require("../services/Inventory/GetAvailableModels");

/** Exports the module */
module.exports = {
    EquipmentAddition: EquipmentAdditionService.EquipmentAddition,
    EquipmentRemoval: EquipmentRemovalService.EquipmentRemoval,
    ModelAddition: ModelAdditionService.ModelAddition,
    TypeAddition: TypeAdditionService.TypeAddition,
    GetAllTypes: GetAllTypesService.GetAllTypes,
    GetAllModelsOfType: GetAllModelsOfTypeService.GetAllModelsOfType,
    ModelsRemoval: ModelsRemovalServices.ModelsRemoval,
    GetTypeInformation: GetTypeInformationService.GetTypeInformation,
    GetModelInformation: GetModelInformationService.GetModelInformation,
    TypesRemoval: TypesRemovalServices.TypesRemoval,
    TypeUpdate: TypeUpdateServices.TypeUpdate, 
    ModelUpdate: ModelUpdateServices.ModelUpdate,
    GetAllModels: GetAllModelsServices.GetAllModels,
    GetAvailableModels: GetAvailableModelsServices.GetAvailableModels
}
