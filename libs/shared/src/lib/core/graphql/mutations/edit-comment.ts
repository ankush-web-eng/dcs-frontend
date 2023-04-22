import { gql } from 'apollo-angular';

export const EDIT_COMMENT_MUTATION = gql`
  mutation ($id: ID!, $body: String){
    updateComment(input: {where: {id: $id} data: {body: $body}}){
      comment {
        id
        body
        published_at
        user {
          id
          username
          avatarUrl
          role { name }
        }
      }
    }
  }
`;
