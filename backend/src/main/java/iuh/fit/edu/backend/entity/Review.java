/*
 * @ (#) .java    1.0
 * Copyright (c)  IUH. All rights reserved.
 */
package iuh.fit.edu.backend.entity;

/*
 * @description
 * @author: Huu Thai
 * @date:
 * @version: 1.0
 */


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private String username;
    private String bookTitle;
    private int rating;
    private String comment;
}
