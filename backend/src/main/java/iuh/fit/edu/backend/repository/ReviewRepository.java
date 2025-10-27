/*
 * @ (#) .java    1.0
 * Copyright (c)  IUH. All rights reserved.
 */
package iuh.fit.edu.backend.repository;

/*
 * @description
 * @author: Huu Thai
 * @date:
 * @version: 1.0
 */
import iuh.fit.edu.backend.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewRepository extends MongoRepository<Review, String> {
}
