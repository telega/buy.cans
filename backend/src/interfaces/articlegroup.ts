import {Document} from 'mongoose';

import {IArticle} from './article'

export interface IArticleGroup extends Document{
	similarityScore?:number
	articles?: Array<IArticle>
}
