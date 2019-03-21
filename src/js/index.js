// Global app controller

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
    
*/

const state = {};


/// Search Controller///

const controlSearch = async () => {
    // 1) get query from view
    
    const query = searchView.getInput();

    
    if (query){
        // 2) new search object and add to the state
        state.search = new Search(query);
        
        // 3) prepere UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        
        try {
            // 4) search for recipes
            await state.search.getResults();
        
            // 5) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result); //pass in the array of 30 recipes
        } catch(error) {
            alert('Something wrong with the search');
            clearLoader();
        }
        
   
    }
}



elements.searchForm.addEventListener('submit', e => {
    e.preventDefault(); //prevents reloading
    controlSearch();
});



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10); //givs access to html property
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});





                                                                    
/// Recipe Controller ///

const controlRecipe = async () => {
    //get id from url
    const id = window.location.hash.replace('#','');
    
    if(id){
        
        //prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        
        //highlight selected search item
        if(state.search) searchView.highlightSelected(id);
        
        //create new recipe object
        state.recipe = new Recipe(id);
        
        
        try {
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            
             
            //testing
          //  window.r = state.recipe;
            
            
            
            // calc servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            
        
            // render the recipe
            clearLoader();
            recipeView.renderRecipe(
                
                state.recipe,
                state.likes.isLiked(id)
            
            );
            
            
        } catch (error){
            
            alert('Error processing recipe.');
        }
        
    }
};


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));




// List Controller

const controlList = () => {
    //create a new list if there is none yet
    if (!state.list) state.list = new List();
    
    
    // add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el =>{  const item = state.list.addItem(el.count, el.unit, el.ingredient)
    
    
    //render the item
    listView.renderItem(item);
    });
}




//Handle delete and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    
    
    // handle the delete button
    
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);
        
        
        //delete from UI
        listView.deleteItem(id);
        
        //handle count update
    }else if (e.target.matches('.shopping__count-value')){
            let del;
        
            const val = parseFloat(e.target.value);
            
            
            if(val >= 0){
                state.list.updateCount(id, val);
            }else{
                del = confirm('Delete this ingredient from your shopping list?');
                if (del){
                     //delete from state
                    state.list.deleteItem(id);
    
                    //delete from UI
                    listView.deleteItem(id);
                }else{
                    state.list.updateCount(id, '');
                    listView.updateVal(id, '');
                }
            }
    }
});



// Like Controller ///

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //current recipe NOT liked yet
    if (!state.likes.isLiked(currentID)) {
        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle the like button
        likesView.toggleLikeBtn(true);
        
        //add like to UI list
        likesView.renderLike(newLike);
        
    //current recipe is already liked    
    } else {
        //remove like to the state
        state.likes.deleteLike(currentID);
        
        //toggle the like button
        likesView.toggleLikeBtn(false);
        
        //remove like to UI list
        likesView.deleteLike(currentID);
        
    }
    
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};




//Restore liked recipes on page load

window.addEventListener('load', () => {
    state.likes = new Likes();
    
    //Restore likes
    state.likes.readStorage();
    
    //Toggle the like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    
    //Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})






//handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    //event delegation with matches
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec'); recipeView.updateServingsIngredients(state.recipe); 
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe); 
        
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //add ingredients to shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        // like controller
        controlLike();
    }
    
});
















