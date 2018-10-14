module Ivy {

	export class Inventory {
		
		items: any = {};

		addItem ( id:string, name:string = null, quantity:number = 1, data:any = null ):void {
			
			//raw object format used to ease serialisation of state
			var newItem = {
				id : id,
				name : name,
				quantity : quantity,
				data : data
			}
			
			//TODO: how to handle this? how to manage accumulation?
				//-need to be able to increment 
				//-need unique and non-unique item types?
			
			if( this.items[ id ] ) {
				console.log( 'warning, item being overwritten', id );
			}
			
			this.items[ id ] = newItem;
				
			//console.log( id, this.items[ id ] );
			
			save();
		}
		
		removeItem ( id, quantity ) {
			
		}
		
		hasItem ( id:string ) {
			//( 'hasItem', this.items[ id ] );
			return ( this.items.hasOwnProperty( id ) );
		}
		
	};

}	