$(function () { // Mesmo que document.addEventListener("DOMContentLoaded")
  $("#navbarToggle").blur(function () {
    if (window.innerWidth < 768) {
      $("#collapsable-nav").collapse('hide');
    }
  });
});

(function (global) {

var dc = {};

var homeHtmlUrl = "snippets/home-snippet.html";
var allCategoriesUrl = "https://coursera-jhu-default-rtdb.firebaseio.com/categories.json";
var categoriesTitleHtml = "snippets/categories-title-snippet.html";
var categoryHtml = "snippets/category-snippet.html";
var menuItemsUrl = "https://coursera-jhu-default-rtdb.firebaseio.com/menu_items/";
var menuItemsTitleHtml = "snippets/menu-items-title.html";
var menuItemHtml = "snippets/menu-item.html";

// Inserir HTML em elemento
var insertHtml = function (selector, html) {
  document.querySelector(selector).innerHTML = html;
};

// Ícone de loading
var showLoading = function (selector) {
  var html = "<div class='text-center'><img src='images/ajax-loader.gif'></div>";
  insertHtml(selector, html);
};

// Substitui {{propName}} por propValue
var insertProperty = function (string, propName, propValue) {
  return string.replace(new RegExp("{{" + propName + "}}", "g"), propValue);
};

// Troca botão ativo
var switchMenuToActive = function () {
  var classes = document.querySelector("#navHomeButton").className;
  document.querySelector("#navHomeButton").className = classes.replace(/active/g, "");

  classes = document.querySelector("#navMenuButton").className;
  if (classes.indexOf("active") === -1) {
    document.querySelector("#navMenuButton").className += " active";
  }
};

// Página inicial
document.addEventListener("DOMContentLoaded", function () {
  showLoading("#main-content");
  $ajaxUtils.sendGetRequest(allCategoriesUrl, buildAndShowHomeHTML, true);
});

// Função de home
function buildAndShowHomeHTML(categories) {
  $ajaxUtils.sendGetRequest(homeHtmlUrl, function (homeHtml) {
    //console.log("Categories recebidas:", categories);

    // Escolhe categoria aleatória para exibição inicial (não fixa)
    var chosenCategoryShortName = chooseRandomCategory(categories).short_name;
    //console.log("Categoria aleatória inicial:", chosenCategoryShortName);

    var homeHtmlToInsert = insertProperty(homeHtml, "{{randomCategoryShortName}}", "'" + chosenCategoryShortName + "'");
    insertHtml("#main-content", homeHtmlToInsert);
  }, false);
}

// Função para categoria aleatória no clique
global.loadRandomCategory = function () {
  $ajaxUtils.sendGetRequest(allCategoriesUrl, function(categories) {
    var randomCategoryShortName = chooseRandomCategory(categories).short_name;
    //console.log("Categoria aleatória no clique:", randomCategoryShortName);
    dc.loadMenuItems(randomCategoryShortName);
  }, true);
};

// Retorna categoria aleatória
function chooseRandomCategory(categories) {
  var randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
}

// Carrega categorias
dc.loadMenuCategories = function () {
  showLoading("#main-content");
  $ajaxUtils.sendGetRequest(allCategoriesUrl, buildAndShowCategoriesHTML);
};

// Carrega itens de categoria
dc.loadMenuItems = function (categoryShort) {
  showLoading("#main-content");

  $ajaxUtils.sendGetRequest(menuItemsUrl + categoryShort + ".json", function (data) {
    //console.log("Dados recebidos para a categoria", categoryShort, data);

    if (data && data.category && data.menu_items) {
      buildAndShowMenuItemsHTML(data, categoryShort);
    } else {
      //console.warn("Menu items não encontrados ou JSON inválido para a categoria:", categoryShort);
      insertHtml("#main-content", "<p>Desculpe, não há itens disponíveis para esta categoria.</p>");
    }
  });
};

// Constrói HTML das categorias
function buildAndShowCategoriesHTML(categories) {
  $ajaxUtils.sendGetRequest(categoriesTitleHtml, function (categoriesTitleHtml) {
    $ajaxUtils.sendGetRequest(categoryHtml, function (categoryHtml) {
      switchMenuToActive();
      var html = buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml);
      insertHtml("#main-content", html);
    }, false);
  }, false);
}

// Constrói view das categorias
function buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml) {
  var finalHtml = categoriesTitleHtml + "<section class='row'>";
  categories.forEach(function(cat) {
    var html = categoryHtml;
    html = insertProperty(html, "name", cat.name);
    html = insertProperty(html, "short_name", cat.short_name);
    finalHtml += html;
  });
  finalHtml += "</section>";
  return finalHtml;
}

// Constrói HTML dos itens da categoria
function buildAndShowMenuItemsHTML(categoryMenuItems, categoryShort) {
  $ajaxUtils.sendGetRequest(menuItemsTitleHtml, function (menuItemsTitleHtml) {
    $ajaxUtils.sendGetRequest(menuItemHtml, function (menuItemHtml) {
      switchMenuToActive();
      var html = buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml);
      insertHtml("#main-content", html);
    }, false);
  }, false);
}

// Constrói view dos itens
function buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml) {
  if (!categoryMenuItems || !categoryMenuItems.category || !categoryMenuItems.menu_items) {
    return "<p>Itens de menu não disponíveis.</p>";
  }

  var category = categoryMenuItems.category;
  var menuItems = categoryMenuItems.menu_items;

  menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "name", category.name);
  menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "special_instructions", category.special_instructions);

  var finalHtml = menuItemsTitleHtml + "<section class='row'>";

  menuItems.forEach(function(item, i) {
    var html = menuItemHtml;
    html = insertProperty(html, "short_name", item.short_name);
    html = insertProperty(html, "catShortName", category.short_name);
    html = insertItemPrice(html, "price_small", item.price_small);
    html = insertItemPortionName(html, "small_portion_name", item.small_portion_name);
    html = insertItemPrice(html, "price_large", item.price_large);
    html = insertItemPortionName(html, "large_portion_name", item.large_portion_name);
    html = insertProperty(html, "name", item.name);
    html = insertProperty(html, "description", item.description);

    if (i % 2 !== 0) html += "<div class='clearfix visible-lg-block visible-md-block'></div>";

    finalHtml += html;
  });

  finalHtml += "</section>";
  return finalHtml;
}

// Prepara preço
function insertItemPrice(html, pricePropName, priceValue) {
  if (!priceValue) return insertProperty(html, pricePropName, "");
  return insertProperty(html, pricePropName, "$" + priceValue.toFixed(2));
}

// Prepara porção
function insertItemPortionName(html, portionPropName, portionValue) {
  if (!portionValue) return insertProperty(html, portionPropName, "");
  return insertProperty(html, portionPropName, "(" + portionValue + ")");
}

global.$dc = dc;

})(window);
