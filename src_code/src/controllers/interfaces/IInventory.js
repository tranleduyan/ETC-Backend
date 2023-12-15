/** Initialize neccessary modules */
const EquipmentRemovalService = require('../services/Inventory/EquipmentRemoval');
const ModelAdditionService = require('../services/Inventory/ModelAddition');
const TypeAdditionService = require('../services/Inventory/TypeAddition');

module.exports = {
    EquipmentRemoval: EquipmentRemovalService.EquipmentRemoval,
    ModelAddition: ModelAdditionService.ModelAddition,
    TypeAddition: TypeAdditionService.TypeAddition,
}