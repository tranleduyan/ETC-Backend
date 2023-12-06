const EqipmentRemovalService = require('../services/Inventory/EquipmentRemoval');
const ModelAdditionService = require('../services/Inventory/ModelAddition');
const TypeAdditionService = require('../services/Inventory/TypeAddition');

module.exports = {
    EqipmentRemoval: EqipmentRemovalService.EqipmentRemoval,
    ModelAddition: ModelAdditionService.ModelAddition,
    TypeAddition: TypeAdditionService.TypeAddition,
}