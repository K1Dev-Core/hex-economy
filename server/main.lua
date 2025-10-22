local Core = exports.vorp_core:GetCore()

local EconomyServer = {}

function EconomyServer:new()
    local obj = {}
    setmetatable(obj, self)
    self.__index = self
    return obj
end

function EconomyServer:init()
    self:setupEventHandlers()
    self:startPriceUpdate()
end

function EconomyServer:setupEventHandlers()
    RegisterServerEvent("economy:requestInventory")
    AddEventHandler("economy:requestInventory", function()
        self:checkPlayerInventory(source)
    end)

    RegisterServerEvent("economy:sellItems")
    AddEventHandler("economy:sellItems", function(items, totalValue)
        self:sellItems(source, items, totalValue)
    end)

    RegisterCommand("updateprices", function(source, args, rawCommand)
        local user = Core.getUser(source)
        if not user then return false end
        local character = user.getUsedCharacter
        if character.group ~= "admin" then
            return 
        end
        print("Updating prices")
        self:updatePrices()
    end, true)
end

function EconomyServer:addMoney(source, amount)
    local user = Core.getUser(source)
    if not user then return false end
    local character = user.getUsedCharacter
    character.addCurrency(0, amount)

    return true
end

function EconomyServer:sellItems(source, items)
    local user = Core.getUser(source)
    if not user then 
        TriggerClientEvent("economy:sellResult", source, false, "User not found")
        return false 
    end
    
    local totalValue = 0
    local validItems = {}
    local totalItems = 0
    local removedItems = 0
    local failedItems = 0
    
    for itemType, quantity in pairs(items) do
        totalItems = totalItems + 1
        exports.vorp_inventory:getItem(source, itemType, function(item)
            if item and item.count and item.count >= quantity then
                local config = Config.Items[itemType]
                if config then
                    local itemValue = quantity * config.basePrice
                    totalValue = totalValue + itemValue
                    validItems[itemType] = quantity
                end
            end
        end)
    end
    
    Wait(100)
    
    if totalValue > 0 then
        for itemType, quantity in pairs(validItems) do
            exports.vorp_inventory:subItem(source, itemType, quantity, nil, function(success)
                if success then
                    removedItems = removedItems + 1
                else
                    failedItems = failedItems + 1
                end
                
                if (removedItems + failedItems) >= totalItems then
                    if failedItems > 0 then
                        TriggerClientEvent("economy:sellResult", source, false, "Failed to remove some items")
                    else
                        self:addMoney(source, totalValue)
                        TriggerClientEvent("economy:sellResult", source, true, "ขายสำเร็จ! ได้รับ $" .. totalValue)
                    end
                end
            end, "economy_sell", 0)
        end
    else
        TriggerClientEvent("economy:sellResult", source, false, "No valid items to sell")
    end
    
    return true
end

function EconomyServer:checkPlayerInventory(source)
    local inventoryData = {}
    local totalItems = 0
    local checkedItems = 0
    local timeout = 0
    
    for itemType, config in pairs(Config.Items) do
        totalItems = totalItems + 1
    end
    
    CreateThread(function()
        while timeout < 100 and checkedItems < totalItems do
            Wait(100)
            timeout = timeout + 1
        end
        
        if checkedItems < totalItems then
            for itemType, config in pairs(Config.Items) do
                if not inventoryData[itemType] then
                    inventoryData[itemType] = {
                        quantity = 0,
                        price = config.basePrice,
                        name = config.name
                    }
                end
            end
        end
        
        TriggerClientEvent("economy:receiveInventory", source, inventoryData)
    end)
    
    for itemType, config in pairs(Config.Items) do
        pcall(function()
            exports.vorp_inventory:getItem(source, itemType, function(item)
                if item and item.count and item.count > 0 then
                    inventoryData[itemType] = {
                        quantity = item.count,
                        price = config.basePrice,
                        name = config.name
                    }
                else
                    inventoryData[itemType] = {
                        quantity = 0,
                        price = config.basePrice,
                        name = config.name
                    }
                end
                
                checkedItems = checkedItems + 1
            end)
        end)
    end
end

function EconomyServer:startPriceUpdate()
    self:updatePrices()
    CreateThread(function()
        while true do
            Wait(Config.UpdateInterval)
            self:updatePrices()
        end
    end)
end

function EconomyServer:updatePrices()
    for itemType, config in pairs(Config.Items) do
        if not config.currentPrice then
            config.currentPrice = config.basePrice
        end
        
        local randomMultiplier = math.random(Config.MinPriceMultiplier * 100, Config.MaxPriceMultiplier * 100) / 100
        local newPrice = math.floor(config.basePrice * randomMultiplier)
        
        newPrice = math.max(newPrice, config.minPrice)
        newPrice = math.min(newPrice, config.maxPrice)
        
        local trend = "stable"
        if newPrice > config.currentPrice then
            trend = "up"
        elseif newPrice < config.currentPrice then
            trend = "down"
        end
        
        config.currentPrice = newPrice
        config.trend = trend
    end
    
    TriggerClientEvent("economy:updatePrices", -1, Config.Items)
end

local server = EconomyServer:new()
server:init()